# NODE-API 

This repository combines all the modules for the javascript backend of Flex-appeal. 


## Usage 


# Testing 

The test setup is currently under change: 
Test make use of Mocha as the test runner and Chai as the assertion framework. 

To run the e2e test individually one can use: 
```
API_ENV=testing node_modules/.bin/_mocha --opts ./mocha.opts --compilers js:babel-register <file_under_test>
```
Whereas `./test-bootstrap.js` contains the logic that provides the assertion framework and the usage of babel 
