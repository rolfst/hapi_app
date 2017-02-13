# NODE-API

This repository contains the server side JavaScript part of the Flex-Appeal API.
The project build is managed by NPM.

## Usage

To test the application there are a few commands:

  - `npm run check` runs all tests and linter (run this before `git push`)
  - `npm run test` runs all tests
  - `npm run test:unit` runs all unit tests
  - `npm run test:e2e` runs all e2e tests
  - `npm run lint` runs the linter

When debugging SQL queries you can pass the `SQL_LOGGING=true` flag when executing a npm command in your terminal.
For example `SQL_LOGGING=true npm run dev` would log all the SQL queries being executed by Sequelize.

To run the application locally one can use:

  `npm run dev`

It is possible to generate some documentation about the method interfaces which are located in the docs directory:

  `npm run doc`

# Testing

Test make use of Mocha as the test runner and Chai as the assertion framework.

To run the e2e test individually one can use:
```
API_ENV=testing node_modules/.bin/_mocha --opts ./mocha.opts  <file_or_folder_under_test>
```
Whereas `./test-bootstrap.js` contains the logic that provides the assertion framework and the usage of babel

To run the unit test individually one can use:
```
API_ENV=testing node_modules/.bin/_mocha --opts ./mocha-spec.opts  <file_or_folder_under_test>
```
## Debugging

To run the test with debugging use:
```
API_ENV=testing node --inspect --debug-brk node_modules/.bin/_mocha --opts ./mocha-spec.opts  <file_or_folder_under_test>
```
this will halt the execution of the test till a debug client can attach itself to the process and this will pause the debugger on the first line.
