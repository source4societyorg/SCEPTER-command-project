'use strict'
const utilities = require('@source4society/scepter-utility-lib')

const initializeProjectCommand = {
  command: 'project:initialize',
  usage: 'project:initialize',
  description: 'Initializes the project by setting up credentials and configuration parameters via a series of questions',
  callback: callbackFunction,
  generateConfiguration: generateConfigurationFunction,
  generateParameters: generateParametersFunction,
  generateEnvironmentConfiguration: generateEnvironmentConfigurationFunction,
  generateProviderConfiguration: generateProviderConfigurationFunction,
  questions: questionsFunction,
  providerSequence: providerSequenceFunction,
  providerQuestions: providerQuestionsFunction,
  validateShell: validateShellFunction,
  utilities: utilities
}

function generateConfigurationFunction () {
  let shell = this.utilities.isEmpty(this.commandObject.parameters) ? '' : this.commandObject.parameters.shell
  let execCommand = ''
  switch (shell) {
    case 'powershell':
      execCommand = 'echo ' + JSON.stringify(this.credentials) + ' > ./config/credentials.json'
      break
    default:
      execCommand = 'echo \'' + JSON.stringify(this.credentials) + '\' > ./config/credentials.json'
  }

  this.commandObject.closeInputStream()
  this.commandObject.executeCommand(
    execCommand,
    'Generated credentials file',
    'Failed to generate credentials file',
    () => this.generateParameters()
  )
}

function generateParametersFunction () {
  let params = {
    appName: this.commandObject.inputs['projectName'],
    shell: this.commandObject.inputs['projectShell']
  }

  let shell = this.utilities.isEmpty(this.commandObject.parameters) ? '' : this.commandObject.parameters.shell
  let execCommand = ''
  switch (shell) {
    case 'powershell':
      execCommand = 'echo ' + JSON.stringify(params) + ' > ./config/parameters.json'
      break
    default:
      execCommand = 'echo \'' + JSON.stringify(params) + '\' > ./config/parameters.json'
  }

  this.commandObject.executeCommand(
    execCommand,
    'Project successfully initialized',
    'Failed to generate parameters file'
  )
}

function generateEnvironmentConfigurationFunction () {
  this.environment[this.commandObject.inputs['environmentName']] = this.provider
  this.credentials.environments = Object.assign(this.credentials.environments, this.environment)
  this.questions(2)
}

function generateProviderConfigurationFunction () {
  this.provider.provider[this.commandObject.inputs['providerName']] = this.providerDetails
  this.questions(4)
}

function validateShellFunction (answer) {
  switch (true) {
    case (answer === 'bash' || answer === 'powershell'):
      this.questions(2)
      break
    default:
      this.commandObject.printMessage('Invalid selection')
      this.questions(1)
  }
}

function providerSequenceFunction (provider) {
  this.providerDetails = {}
  switch (provider) {
    case 'aws':
      this.providerQuestions(0, this.awsQuestionList)
      break
    case 'azure':
      this.providerQuestions(0, this.azureQuestionList)
      break
    default:
      this.commandObject.printMessage('Invalid provider specified. Please specify either "aws" or "azure"')
      this.questions(5)
  }
}

function questionsFunction (index) {
  if (this.questionList[index].branch) {
    this.commandObject.readInput(this.questionList[index].key, this.questionList[index].question, (answer) => {
      if (answer.toLowerCase() === 'y') {
        this.questionList[index].yesCallback(index, answer)
      } else if (answer.toLowerCase() === 'n') {
        this.questionList[index].noCallback(index, answer)
      } else {
        this.commandObject.printMessage('Invalid input, please answer with y or n')
        this.questions(index)
      }
    })
  } else {
    this.commandObject.readInput(this.questionList[index].key, this.questionList[index].question, (answer) => this.questionList[index].callback(index, answer))
  }
}

function providerQuestionsFunction (index, providerQuestionList) {
  this.commandObject.readInput(providerQuestionList[index].key, providerQuestionList[index].question, (answer) => {
    this.providerDetails[providerQuestionList[index].key] = answer
    index < (providerQuestionList.length - 1)
      ? this.providerQuestions(index + 1, providerQuestionList)
      : this.generateProviderConfiguration()
  })
}

function callbackFunction (args, credentials, command) {
  this.commandObject = command
  this.provider = { provider: {} }
  this.providerDetails = {}
  this.environment = {}
  this.credentials = { environments: {} }
  this.questionList = [
    {
      key: 'projectName',
      question: 'Project name?: ',
      branch: false,
      callback: () => this.questions(1)
    },
    {
      key: 'projectShell',
      question: 'Which terminal shell are you using (bash, powershell)?: ',
      branch: false,
      callback: (index, answer) => this.validateShell(answer)
    },
    {
      key: 'addEnvironment',
      question: 'Add an environment? (Y/N): ',
      branch: true,
      yesCallback: () => this.questions(3),
      noCallback: () => this.generateConfiguration()
    },
    {
      key: 'environmentName',
      question: 'Environment name?: ',
      branch: false,
      callback: () => this.questions(4)
    },
    {
      key: 'addProvider',
      question: 'Add a provider? (Y/N): ',
      branch: true,
      yesCallback: () => this.questions(5),
      noCallback: () => this.generateEnvironmentConfiguration()
    },
    {
      key: 'providerName',
      question: 'Provider name (aws, azure)?: ',
      branch: false,
      callback: (index, answer) => this.providerSequence(answer)
    }
  ]
  this.awsQuestionList = [
    {
      key: 'accessKeyId',
      question: 'Enter your AWS Access Key: '
    },
    {
      key: 'secretAccessKey',
      question: 'Enter your AWS Secret Access Key: '
    },
    {
      key: 'region',
      question: 'Enter the AWS region (ex. us-east-1): '
    },
    {
      key: 'account',
      question: 'Enter your AWS account number: '
    },
    {
      key: 'maxRetries',
      question: 'Enter the maximum retries for the AWS SDK: '
    }
  ]
  this.azureQuestionList = [
    {
      key: 'subscriptionId',
      question: 'Enter your Azure subscription ID: '
    },
    {
      key: 'appId',
      question: 'Enter Azure app ID: '
    },
    {
      key: 'displayName',
      question: 'Enter your Azure display name: '
    },
    {
      key: 'tenantId',
      question: 'Enter your Azure tenant ID: '
    },
    {
      key: 'clientId',
      question: 'Enter your Azure client ID: '
    },
    {
      key: 'password',
      question: 'Enter your Azure password: '
    }
  ]

  command.prepareToReceiveInput()
  this.questions(0)
}

module.exports = initializeProjectCommand
