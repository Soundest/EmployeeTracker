const inquirer = require('inquirer');
const mysql = require('mysql2/promise');

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'employee_tracker'
});

async function main() {
  // Connect to the database
  await connection.connect();

  // Start the inquirer prompts
  const choice = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Exit'
      ]
    }
  ]);

  switch (choice.action) {
    case 'View all departments':
      // Query the database to retrieve all departments
      const [departments] = await connection.query('SELECT * FROM department');
      console.table(departments);
      break;

    case 'View all roles':
      // Query the database to retrieve all roles with department information
      const [roles] = await connection.query(`
        SELECT role.id, role.title, role.salary, department.name AS department
        FROM role
        INNER JOIN department ON role.department_id = department.id
      `);
      console.table(roles);
      break;

    case 'View all employees':
      // Query the database to retrieve all employees with role and manager information
      const [employees] = await connection.query(`
        SELECT
          employee.id,
          employee.first_name,
          employee.last_name,
          role.title AS job_title,
          department.name AS department,
          role.salary,
          CONCAT(manager.first_name, ' ', manager.last_name) AS manager
        FROM employee
        INNER JOIN role ON employee.role_id = role.id
        INNER JOIN department ON role.department_id = department.id
        LEFT JOIN employee manager ON employee.manager_id = manager.id
      `);
      console.table(employees);
      break;

    case 'Add a department':
      // Prompt user for department name
      const { departmentName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'departmentName',
          message: 'Enter the name of the department:'
        }
      ]);

      // Insert new department into the database
      await connection.query('INSERT INTO department (name) VALUES (?)', [departmentName]);
      console.log('Department added successfully!');
      break;

    case 'Add a role':
      // Prompt user for role information
      const roleData = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the title of the role:'
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Enter the salary for the role:'
        },
        {
          type: 'input',
          name: 'department_id',
          message: 'Enter the department ID for the role:'
        }
      ]);

      // Insert new role into the database
      await connection.query('INSERT INTO role SET ?', roleData);
      console.log('Role added successfully!');
      break;

    case 'Add an employee':
      // Prompt user for employee information
      const employeeData = await inquirer.prompt([
        {
          type: 'input',
          name: 'first_name',
          message: 'Enter the first name of the employee:'
        },
        {
          type: 'input',
          name: 'last_name',
          message: 'Enter the last name of the employee:'
        },
        {
          type: 'input',
          name: 'role_id',
          message: 'Enter the role ID for the employee:'
        },
        {
          type: 'input',
          name: 'manager_id',
          message: 'Enter the manager ID for the employee (leave blank if none):'
        }
      ]);

      // Insert new employee into the database
      await connection.query('INSERT INTO employee SET ?', employeeData);
      console.log('Employee added successfully!');
      break;

    case 'Update an employee role':
      // Query the database to get a list of employees
      const [employeeList] = await connection.query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee');

      // Prompt user to select an employee to update
      const { employeeId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'employeeId',
          message: 'Select an employee to update their role:',
          choices: employeeList.map(employee => ({ name: employee.name, value: employee.id }))
        }
      ]);

      // Prompt user for the new role ID
      const { newRoleId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newRoleId',
          message: 'Enter the new role ID for the employee:'
        }
      ]);

      // Update the employee's role in the database
      await connection.query('UPDATE employee SET role_id = ? WHERE id = ?', [newRoleId, employeeId]);
      console.log('Employee role updated successfully!');
      break;

    case 'Exit':
      // End the connection and exit the application
      await connection.end();
      return;

    default:
      console.log('Invalid choice. Please select a valid option.');
  }

  // Continue the application loop
  main();
}

// Start the application
main();
