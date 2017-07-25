'use strict';
// Create React components in this class and use the React.render() function to render it in the DOM.

// tag::vars[]
// Fetch modules required since we're using webpack.
// React is the main library from Facebook for building this app.
const React = require('react');
const ReactDOM = require('react-dom')
const when = require('when');
// client.js contains the custom code for configuring rest.js
const client = require('./client');

const follow = require('./follow'); // function to hop multiple links by "rel"

const stompClient = require('./websocket-listener');

const root = '/api';
// end::vars[]

// tag::app[]
// Extend React.Component to create a React component
// This component fetches an array of employees from the Spring Data REST backend and stores the array
// in this component's state data.

class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {employees: [], attributes: [], page: 1, pageSize: 2, links: {}};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
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
				    /**
				     * Filter unneeded JSON Schema properties, like uri references and
				     * subtypes ($ref). Trim out both URI relations as well as $ref entries.
				     */
				    Object.keys(schema.entity.properties).forEach(function (property) {
				    	if (schema.entity.properties[property].hasOwnProperty('format') &&
				    		schema.entity.properties[property].format === 'uri') {
				    		delete schema.entity.properties[property];
				    	}
				    	else if (schema.entity.properties[property].hasOwnProperty('$ref')) {
				    		delete schema.entity.properties[property];
				    	}
				    });

				    this.schema = schema.entity;
				    this.links = employeeCollection.entity._links;
				    return employeeCollection;
				});
		}).then(employeeCollection => {
			this.page = employeeCollection.entity.page;
			return employeeCollection.entity._embedded.employees.map(employee =>
					client({
						method: 'GET',
						path: employee._links.self.href
					})
			);
		}).then(employeePromises => {
			return when.all(employeePromises);
		}).done(employees => {
			this.setState({
				page: this.page,
				employees: employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
			});
		});
	}
	// end::follow-2[]

	// tag::on-create[]
	onCreate(newEmployee) {
	    // Use the follow() function to get the employees link and
	    // then send a POST request for the new employee to be added in.
		follow(client, root, ['employees']).done(response => {
			client({
				method: 'POST',
				path: response.entity._links.self.href,
				entity: newEmployee,
				headers: {'Content-Type': 'application/json'}
			})
		})
	}
	// end::on-create[]

	// tag::update[]
	onUpdate(employee, updatedEmployee) {
		client({
			method: 'PUT',
			path: employee.entity._links.self.href,
			entity: updatedEmployee,
			headers: {
				'Content-Type': 'application/json',
				'If-Match': employee.headers.Etag
			}
		}).done(response => {
			/* Let the websocket handler update the state */
		}, response => {
			if (response.status.code === 403) {
        		alert('ACCESS DENIED: You are not authorized to update ' +
        			employee.entity._links.self.href);
        	}
			if (response.status.code === 412) {
				alert('DENIED: Unable to update ' + employee.entity._links.self.href + '. Your copy is stale.');
			}
		});
	}
	// end::update[]

	// tag::delete[]
	onDelete(employee) {
	    client({
	        method: 'DELETE',
	        path: employee.entity._links.self.href
	    }).done(response => {
	        /* let the websocket handle updating the UI */
	    }, response => {
	    	if (response.status.code === 403) {
	    		alert('ACCESS DENIED: You are not authorized to delete ' +
	    			employee.entity._links.self.href);
		    }
	    });
	}
	// end::delete[]

    // tag::navigate[]
    // Used to manage the state of the UI, invoked to change page.
    onNavigate(navUri) {
		client({
			method: 'GET',
			path: navUri
		}).then(employeeCollection => {
			this.links = employeeCollection.entity._links;
			this.page = employeeCollection.entity.page;

			return employeeCollection.entity._embedded.employees.map(employee =>
					client({
						method: 'GET',
						path: employee._links.self.href
					})
			);
		}).then(employeePromises => {
			return when.all(employeePromises);
		}).done(employees => {
			this.setState({
				page: this.page,
				employees: employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
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

	// tag::websocket-handlers[]
	refreshAndGoToLastPage(message) {
		follow(client, root, [{
			rel: 'employees',
			params: {size: this.state.pageSize}
		}]).done(response => {
			if (response.entity._links.last !== undefined) {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		})
	}

    // Fetches the same page you are currently on and updates the state accordingly.
	refreshCurrentPage(message) {
		follow(client, root, [{
			rel: 'employees',
			params: {
				size: this.state.pageSize,
				page: this.state.page.number
			}
		}]).then(employeeCollection => {
			this.links = employeeCollection.entity._links;
			this.page = employeeCollection.entity.page;

			return employeeCollection.entity._embedded.employees.map(employee => {
				return client({
					method: 'GET',
					path: employee._links.self.href
				})
			});
		}).then(employeePromises => {
			return when.all(employeePromises);
		}).then(employees => {
			this.setState({
				page: this.page,
				employees: employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}
	// end::websocket-handlers[]

	// tag::register-handlers[]
	// A component's componentDidMount() is the function invoked after it is rendered in the DOM.
	componentDidMount() {
		this.loadFromServer(this.state.pageSize);
		// An array of JavaScript objects being registered for WebSocket events, with a route and callback.
		stompClient.register([
			{route: '/topic/newEmployee', callback: this.refreshAndGoToLastPage},
			{route: '/topic/updateEmployee', callback: this.refreshCurrentPage},
			{route: '/topic/deleteEmployee', callback: this.refreshCurrentPage}
		]);
	}
	// end::register-handlers[]

    // "Draw" the component on the screen.
	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
				<EmployeeList page={this.state.page}
							  employees={this.state.employees}
							  links={this.state.links}
							  pageSize={this.state.pageSize}
							  attributes={this.state.attributes}
							  onNavigate={this.onNavigate}
							  onUpdate={this.onUpdate}
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
			ReactDOM.findDOMNode(this.refs[attribute]).value = ''; // clear out the dialog's inputs
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

// tag::update-dialog[]
class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		// Create an updateEmployee object with blank attributes.
		var updatedEmployee = {};
		// Use React.findDOMNode() to extract details of the pop-up using React refs.
		var attributeNumber = 0;
		this.props.attributes.forEach(attribute => {
		// Load input values into the updatedEmployee object.
		// TODO : The findDOMNode() method returns null for the manager attribute
		    updatedEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		// Invoke the onUpdate() method.
		this.props.onUpdate(this.props.employee, updatedEmployee);
        window.location = "#";
	}

	render() {
		var inputs = this.props.attributes.map(attribute =>
				<p key={this.props.employee.entity[attribute]}>
					<input type="text" placeholder={attribute}
						   defaultValue={this.props.employee.entity[attribute]}
						   ref={attribute} className="field" />
				</p>
		);

		var dialogId = "updateEmployee-" + this.props.employee.entity._links.self.href;

		return (
			<div>
				<a href={"#" + dialogId}>Update</a>

				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Update an employee</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

}

class EmployeeList extends React.Component {

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
			ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
		}
	}
	// end::handle-page-size-updates[]

	// tag::handle-nav[]
	// Invokes the App.onNavigate function to change page using the proper hypermedia link.
	handleNavFirst(e) {
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
	// tag::employee-list-render[]
	render() {
		var pageInfo = this.props.page.hasOwnProperty("number") ?
			<h3>Employees - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

		var employees = this.props.employees.map(employee =>
			<Employee key={employee.entity._links.self.href}
					  employee={employee}
					  attributes={this.props.attributes}
					  onUpdate={this.props.onUpdate}
					  onDelete={this.props.onDelete}/>
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
				{pageInfo}
				<input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
				<table>
					<tbody>
						<tr>
							<th>First Name</th>
							<th>Last Name</th>
							<th>Description</th>
							<th>Manager</th>
							<th></th>
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
	// end::employee-list-render[]
}

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

    // Draw what appears on the UI (in the table) for each employee.
	render() {
		return (
			<tr>
				<td>{this.props.employee.entity.firstName}</td>
				<td>{this.props.employee.entity.lastName}</td>
				<td>{this.props.employee.entity.description}</td>
				<td>{this.props.employee.entity.manager.name}</td>
				<td>
					<UpdateDialog employee={this.props.employee}
								  attributes={this.props.attributes}
								  onUpdate={this.props.onUpdate}/>
				</td>
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
