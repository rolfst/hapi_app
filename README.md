<<<<<<< HEAD
# NODE-API 

This repository combines all the modules for the javascript backend of Flex-appeal. 

The project build is managed by npm. 

## Usage 

To test the application there are a few commands: 

  - `npm run check` runs all tests and linter (run this before `git push`)
  - `npm run test` runs all tests 
  - `npm run test:unit` runs all unit tests 
  - `npm run test:e2e` runs all e2e tests 
  - `npm run lint` runs the linter 

To run the application locally one can use: 

  `npm run dev` 

It is possible to generate some documentation about the method interfaces which are located in the docs directory:

  `npm run doc`

# Testing 

The test setup is currently under change: 
Test make use of Mocha as the test runner and Chai as the assertion framework. 

To run the e2e test individually one can use: 
```
API_ENV=testing node_modules/.bin/_mocha --opts ./mocha.opts --compilers js:babel-register <file_under_test>
```
Whereas `./test-bootstrap.js` contains the logic that provides the assertion framework and the usage of babel 
