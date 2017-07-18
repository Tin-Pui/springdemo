'use strict';
// Create React components in this class and use the React.render() function to render it in the DOM.

// tag::vars[]
// Fetch modules required since we're using webpack.
// React is the main library from Facebook for building this app.
const React = require('react');
const ReactDOM = require('react-dom')
// client.js contains the custom code for configuring rest.js
const client = require('./client');
// function to hop multiple links by "rel"
const follow = require('./follow');
// The onloy path that is hardcoded should be the root.
 const root = '/api';
// end::vars[]

// tag::app[]
// Extend React.Component to create a React component
// This component fetches an array of employees from the Spring Data REST backend and stores the array
// in this component's state data.

class App extends React.Component {

	constructor(props) {
		super(props);
		// Initialize state with empty attributes.
		this.state = {employees: [], attributes: [], pageSize: 2, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
	}

	// tag::follow-2[]
	loadFromServer(pageSize) {
	// The follow() function has 3 arguments.
	// The first argument is the client object used to make REST calls.
	// The second argument is the root URI to start from.
	// The third argument is an array of relationships to navigate along.
	// Each one can be a string or an object.
		follow(client, root, [
			{rel: 'employees', params: {size: pageSize}}]
		).then(employeeCollection => {
			return client({
				method: 'GET',
				path: employeeCollection.entity._links.profile.href,
				headers: {'Accept': 'application/schema+json'}
			}).then(schema => {
				this.schema = schema.entity;
				return employeeCollection;
			});
		}).done(employeeCollection => {
			this.setState({
				employees: employeeCollection.entity._embedded.employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: employeeCollection.entity._links});
		});
	}
	// end::follow-2[]

    // tag::create[]
    onCreate(newEmployee) {
        follow(client, root, ['employees']).then(employeeCollection => {
        	return client({
        		method: 'POST',
        		path: employeeCollection.entity._links.self.href,
        		entity: newEmployee,
        		headers: {'Content-Type': 'application/json'}
        	})
        }).then(response => {
        	return follow(client, root, [
        		{rel: 'employees', params: {'size': this.state.pageSize}}]);
        }).done(response => {
        	if (typeof response.entity._links.last != "undefined") {
        		this.onNavigate(response.entity._links.last.href);
        	} else {
        		this.onNavigate(response.entity._links.self.href);
        	}
        });
    }
    // end::create[]

    // tag::delete[]
    onDelete(employee) {
        client({method: 'DELETE', path: employee._links.self.href}).done(response => {
        	this.loadFromServer(this.state.pageSize);
        });
    }
    // end::delete[]

    // tag::navigate[]
    onNavigate(navUri) {
        client({method: 'GET', path: navUri}).done(employeeCollection => {
        	this.setState({
        		employees: employeeCollection.entity._embedded.employees,
        		attributes: this.state.attributes,
        		pageSize: this.state.pageSize,
        		links: employeeCollection.entity._links
        	});
        });
    }
    // end::navigate[]

    // tag::update-page-size[]
    updatePageSize(pageSize) {
    	if (pageSize !== this.state.pageSize) {
    		this.loadFromServer(pageSize);
    	}
    }
    // end::update-page-size[]

    // tag::follow-1[]
    // Invoked after React renders the component in the DOM. Lookup data from the
    // server and populate attributes.
    componentDidMount() {
    	this.loadFromServer(this.state.pageSize);
    		//client({method: 'GET', path: '/api/employees'}).done(response => {
        		// Update the state by calculating a difference between the previous and the new state and
              // inject a set of changes to the DOM on the page.
        	//	this.setState({employees: response.entity._embedded.employees});
        	//});
    }
    // end::follow-1[]

    // "Draw" the component on the screen.
	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
				<EmployeeList employees={this.state.employees}
							  links={this.state.links}
							  pageSize={this.state.pageSize}
							  onNavigate={this.onNavigate}
							  onDelete={this.onDelete}
							  updatePageSize={this.updatePageSize}/>
			</div>
		)
	}
}
// end::app[]

// tag::create-dialog[]
// Add extra controls to the UI.
class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

    // Handle user input. Uses the same JSON Schema attribute property
    // to find each <input> using React.findDOMNode(this.refs[attribute]).
	handleSubmit(e) {
		e.preventDefault();
		var newEmployee = {};
		this.props.attributes.forEach(attribute => {
			newEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		// Invoke App.onCreate after building up newEmployee.
		this.props.onCreate(newEmployee);

		// clear out the dialog's inputs
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = '';
		});

		// Navigate away from the dialog to hide it.
		window.location = "#";
	}

    // Maps over the JSON Schema data found in the attributes property
    // and converts it into an array of <p><input></p> elements.
	render() {
		var inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field" />
			</p>
		);

		return (
			<div>
				<a href="#createEmployee">Create</a>

				<div id="createEmployee" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new employee</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

}
// end::create-dialog[]

// tag::employee-list[]
class EmployeeList extends React.Component{

	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}

	// tag::handle-page-size-updates[]
	handleInput(e) {
		e.preventDefault();
		var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			ReactDOM.findDOMNode(this.refs.pageSize).value =
				pageSize.substring(0, pageSize.length - 1);
		}
	}
	// end::handle-page-size-updates[]

	// tag::handle-nav[]
	handleNavFirst(e){
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}

	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}

	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}
	// end::handle-nav[]

	render() {
	    // Transform array of employee records into an array of Employee React components.
	    // Each Employee React component with two properties, the key and data.
		var employees = this.props.employees.map(employee =>
			<Employee key={employee._links.self.href} employee={employee} onDelete={this.props.onDelete}/>
		);

		var navLinks = [];
		if ("first" in this.props.links) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
		}
		if ("prev" in this.props.links) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
		}
		if ("next" in this.props.links) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
		}
		if ("last" in this.props.links) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
		}

		// Return an HTML table wrapped around the array of employees.
		return (
			<div>
				<input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
				<table>
					<tbody>
						<tr>
							<th>First Name</th>
							<th>Last Name</th>
							<th>Description</th>
							<th></th>
						</tr>
						{employees}
					</tbody>
				</table>
				<div>
					{navLinks}
				</div>
			</div>
		)
	}
}
// end::employee-list[]

// tag::employee[]
// Define what an Employee React component is.
class Employee extends React.Component {

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleDelete() {
		this.props.onDelete(this.props.employee);
	}

	render() {
		return (
			<tr>
				<td>{this.props.employee.firstName}</td>
				<td>{this.props.employee.lastName}</td>
				<td>{this.props.employee.description}</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}
}
// end::employee[]

// tag::render[]
// Render the whole thing.
ReactDOM.render(
	<App />,
	document.getElementById('react')
)
// end::render[]
