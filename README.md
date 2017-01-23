# NODE-API

This repository contains the server side JavaScript part of the Flex-Appeal API.
The project build is managed by npm.

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
