const express = require ('express');
const helmet = require ('helmet');
const cors = require ('cors');
const morgan = require ('morgan');
var bodyParser = require('body-parser')
const validateRule = require ("./ruleValidator")

const app = express ();

app.use (cors ());
app.use (helmet ());
app.use (morgan ('dev'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const port = process.env.PORT || 5544;

app.get ('/', async (_, res) => {
  const myInfo = {
    message: 'My Rule-Validation API',
    status: 'success',
    data: {
      name: 'Siyanbola Opeoluwa',
      github: '@criotech',
      email: 'opesiyanbola8991@gmail.com',
      mobile: '08167526178',
      twitter: '@opeoluw14262429',
    },
  };
  res.status (200).json (myInfo);
});

// Returns if a value is an object
function isObject (value) {
  return value && typeof value === 'object' && value.constructor === Object;
}

// Returns if a value is an array
function isArray (value) {
  return value && typeof value === 'object' && value.constructor === Array;
}

// Returns if a value is really a number
function isNumber (value) {
  return typeof value === 'number' && isFinite (value);
}

// Returns if a value is a string
function isString (value) {
  return typeof value === 'string' || value instanceof String;
}

app.post ('/validate-rule', async (req, res) => {
  const validationObject = req.body

  try {
    //The rule and data fields are required.(check if exist and also validate the data type)
    let topLevelKey = ['rule', 'data'];
    topLevelKey.map (x => {
      if (!(x in validationObject))
        throw {
          message: `${x} is required.`,
          status: 'error',
          data: null,
        };
      //check if rule is an object
      if (x === 'rule') {
        if (!isObject (validationObject[x]))
          throw {
            message: 'rule should be an object.',
            status: 'error',
            data: null,
          };
      }
      //Check if data field is either [Json, array, string]
      if (x === 'data') {
        if (
          !isString (validationObject[x]) &&
          !isArray (validationObject[x]) &&
          !isObject (validationObject[x])
        )
          throw {
            message: 'data should be of type object or array or string.',
            status: 'error',
            data: null,
          };
      }
    });

    let rule = validationObject.rule, data = validationObject.data;
    let allowedRuleCondition = ['eq', 'neq', 'gt', 'gte', "contains"];

    // Validate rule children
    let requireRuleKey = ['field', 'condition', 'condition_value'];
    requireRuleKey.map (x => {
      //check if rule require field exist
      if (!(x in rule))
        throw {
          message: `${x} is required.`,
          status: 'error',
          data: null,
        };
      //type rule children  validation
      if (x === 'field') {
        // check if rule.field is a string
        if (!isString (rule['field']))
          throw {
            message: 'field should be a string.',
            status: 'error',
            data: null,
          };
      }
      if (x === 'condition') {
        //check if condition value if any of the following ['eq', 'neq', 'gt', 'gte']
        if (!allowedRuleCondition.includes (rule[x]))
          throw {
            message: `${rule[x]} is not a valid condition.`,
            status: 'error',
            data: null,
          };
      }
    });

    //Validate data children
    let dataRuleField;

    let ruleField = rule.field;

    if (isObject (data)) {
      let twoDRuleFiledArray = [];
      ruleField.split ('.').map (x => {
        twoDRuleFiledArray.push ([x]);
      });
      dataRuleField = twoDRuleFiledArray;
      if (dataRuleField.length > 2) {
        throw {
          message: `Rule.field nesting should not be more than two levels.`,
          status: 'error',
          data: null,
        };
      }
    }

    if (isString (data)) {
      throw {
        message: `field ${ruleField} is missing from data.`,
        status: 'error',
        data: null,
      };
    }

    if (isArray (data)) {
      throw {
        message: `field ${ruleField} is missing from data.`,
        status: 'error',
        data: null,
      };
    }

    if ( !isObject (data[dataRuleField[0][0]]) && dataRuleField.length === 2) {
      throw {
        message: 'Invalid JSON payload passed.',
        status: 'error',
        data: null,
      };
    }

    //check if rule field exist in data
    if (dataRuleField[0][0]) {
      if (!(dataRuleField[0][0] in data))
        throw {
          message: `field ${ruleField} is missing from data.`,
          status: 'error',
          data: null,
        };
      if (
        isObject (data[dataRuleField[0][0]]) &&
        !(dataRuleField[1][0] in data[dataRuleField[0][0]])
      )
        throw {
          message: `field ${ruleField} is missing from data.`,
          status: 'error',
          data: null,
        };

      //make rule validation
      if (dataRuleField[0][0] in data && dataRuleField.length === 1) {
        if (
          validateRule (
            data[dataRuleField[0][0]],
            rule.condition,
            rule.condition_value
          )
        ) {
          res.status (201).json ({
            message: `field ${rule.field} successfully validated.`,
            status: 'success',
            data: {
              validation: {
                error: false,
                field: rule.field,
                field_value: data[dataRuleField[0][0]],
                condition: rule.condition,
                condition_value: rule.condition_value,
              },
            },
          });
        } else {
          throw {
            message: `field ${rule.field} failed validation.`,
            status: 'error',
            data: {
              validation: {
                error: false,
                field: rule.field,
                field_value: data[dataRuleField[0][0]],
                condition: rule.condition,
                condition_value: rule.condition_value,
              },
            },
          };
        }
      } else if (
        dataRuleField[1][0] in data[dataRuleField[0][0]] &&
        dataRuleField.length === 2
      ) {
        if (
          validateRule (
            data[dataRuleField[0][0]][dataRuleField[1][0]],
            rule.condition,
            rule.condition_value
          )
        ) {
          res.status (201).json ({
            message: `field ${rule.field} successfully validated.`,
            status: 'success',
            data: {
              validation: {
                error: false,
                field: rule.field,
                field_value: data[dataRuleField[0][0]][dataRuleField[1][0]],
                condition: rule.condition,
                condition_value: rule.condition_value,
              },
            },
          });
        } else {
          throw {
            message: `field ${rule.field} failed validation.`,
            status: 'error',
            data: {
              validation: {
                error: false,
                field: rule.field,
                field_value: data[dataRuleField[0][0]][dataRuleField[1][0]],
                condition: rule.condition,
                condition_value: rule.condition_value,
              },
            },
          };
        }
      } else if (isString (data[dataRuleField[0][0]])) {
        throw {
          message: 'Invalid JSON payload passed.',
          status: 'error',
          data: null,
        };
      }
    }
    // res.status (201).json ({msg: 'passed'});
  } catch (error) {
    res.status (400).json (error);
  }
});

app.use (function (req, res, next) {
  res.status (404).json ({err: 'not found'});
});

app.listen (port, () => console.log (`Listening on port ${port}`));




