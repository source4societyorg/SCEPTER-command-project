const testInitializeProjectCommand = require('../initialize')

test('command is correct', () => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  expect(initializeProjectCommand.command).toEqual('project:initialize')
})

test('usage and description are defined', () => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  expect(initializeProjectCommand.usage.length).toBeGreaterThan(0)
  expect(initializeProjectCommand.description.length).toBeGreaterThan(0)
})

test('callback function constructs command invokes the questions function', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  initializeProjectCommand.questions = () => done()
  initializeProjectCommand.callback(undefined, undefined, undefined)
})

test('questions function handles nonbranched question properly', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockQuestionList = [
    {
      key: 'test',
      question: 'test question',
      branch: false,
      callback: done
    }
  ]
  const mockCommandObject = {
    readInput: (key, question, callbackFunc) => callbackFunc('someinput')
  }

  initializeProjectCommand.questionList = mockQuestionList
  initializeProjectCommand.commandObject = mockCommandObject
  initializeProjectCommand.questions(0)
})

test('questions function handles branched question with yes answer properly', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockQuestionList = [
    {
      key: 'test',
      question: 'test question',
      branch: false,
      callback: (index) => done()
    },
    {
      key: 'test2',
      question: 'test question 2',
      branch: true,
      yesCallback: (index) => done(),
      noCallback: (index) => done()
    }
  ]
  const mockCommandObject = {
    readInput: (key, question, callbackFunc) => callbackFunc('y')
  }
  initializeProjectCommand.questionList = mockQuestionList
  initializeProjectCommand.commandObject = mockCommandObject
  initializeProjectCommand.questions(1)
})

test('questions function handles branched question with "no" answer properly', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockQuestionList = [
    {
      key: 'test',
      question: 'test question',
      branch: false,
      callback: (index) => done()
    },
    {
      key: 'test2',
      question: 'test question 2',
      branch: true,
      yesCallback: (index) => done(),
      noCallback: (index) => done()
    }
  ]
  const mockCommandObject = {
    readInput: (key, question, callbackFunc) => callbackFunc('n')
  }
  initializeProjectCommand.questionList = mockQuestionList
  initializeProjectCommand.commandObject = mockCommandObject
  initializeProjectCommand.questions(1)
})

test('questions function handles branched question wiith invalid answer properly', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockQuestionList = [
    {
      key: 'test',
      question: 'test question',
      branch: false,
      callback: (index) => done()
    },
    {
      key: 'test2',
      question: 'test question 2',
      branch: true,
      yesCallback: (index) => done(),
      noCallback: (index) => done()
    }
  ]
  let callbackCount = 0
  const mockCommandObject = {
    readInput: (key, question, callbackFunc) => {
      callbackCount++
      callbackFunc(callbackCount > 2 ? 'n' : 'invalid')
    },
    printMessage: (message) => {
      expect(message).toEqual('Invalid input, please answer with y or n')
    }
  }
  initializeProjectCommand.questionList = mockQuestionList
  initializeProjectCommand.commandObject = mockCommandObject
  initializeProjectCommand.questions(1)
})

test('questions callbacks execute without problems', () => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockCallback = () => 'do nothing'
  initializeProjectCommand.questions = mockCallback
  initializeProjectCommand.generateEnvironmentConfiguration = mockCallback
  initializeProjectCommand.providerSequence = mockCallback
  initializeProjectCommand.generateConfiguration = mockCallback
  initializeProjectCommand.validateShell = mockCallback
  initializeProjectCommand.callback()
  for (let i = 0; i < initializeProjectCommand.questionList.length; i++) {
    if (typeof initializeProjectCommand.questionList[i].callback !== 'undefined') {
      initializeProjectCommand.questionList[i].callback()
    } else {
      initializeProjectCommand.questionList[i].yesCallback()
      initializeProjectCommand.questionList[i].noCallback()
    }
  }
})

test('provider sequence function validates choices, calls proper function', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockCallback = () => 'do nothing'
  const commandObject = {
    printMessage: () => 'do nothing'
  }
  initializeProjectCommand.questions = mockCallback
  initializeProjectCommand.providerQuestions = mockCallback
  initializeProjectCommand.commandObject = commandObject
  initializeProjectCommand.questions = () => done()
  initializeProjectCommand.providerSequence('aws')
  initializeProjectCommand.providerSequence('azure')
  initializeProjectCommand.providerSequence('invalid')
})

test('provider question function reads input until index is at end of question list', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const providerQuestions = [
    {
      key: 'question1',
      question: 'testquestion'
    },
    {
      key: 'question2',
      question: 'testquestion2'
    }
  ]

  const commandObject = {
    readInput: (key, question, callbackFunc) => callbackFunc()
  }

  initializeProjectCommand.providerDetails = {}
  initializeProjectCommand.commandObject = commandObject
  initializeProjectCommand.generateProviderConfiguration = () => done()
  initializeProjectCommand.providerQuestions(0, providerQuestions)
})

test('validateShellFunction validates the shell input', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const commandObject = {
    printMessage: (message) => {
      expect(message).toEqual('Invalid selection')
    }
  }
  const mockQuestions = (index) => {
    if (index === 1) {
      done()
    }
  }

  initializeProjectCommand.commandObject = commandObject
  initializeProjectCommand.questions = mockQuestions
  initializeProjectCommand.validateShell('aws')
  initializeProjectCommand.validateShell('azure')
  initializeProjectCommand.validateShell('invalid')
})

test('generateProviderConfiguration function gets the provider details and saves it', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockProviderDetails = {
    aws: {}
  }
  const mockCommand = {
    inputs: {
      providerName: 'test'
    }
  }
  const mockQuestions = () => {
    expect(initializeProjectCommand.provider.provider['test']).toEqual(mockProviderDetails)
    done()
  }

  initializeProjectCommand.provider = { provider: {} }
  initializeProjectCommand.commandObject = mockCommand
  initializeProjectCommand.providerDetails = mockProviderDetails
  initializeProjectCommand.questions = mockQuestions
  initializeProjectCommand.generateProviderConfiguration()
})

test('generateEnvironmentConfiguration sets the environment object', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockProvider = {
  }
  const mockEnvironment = {

  }
  const mockCommand = {
    inputs: {
      environmentName: 'test'
    }
  }
  const mockQuestions = () => {
    expect(initializeProjectCommand.environment['test']).toEqual(mockProvider)
    done()
  }
  const mockCredentials = { environments: {} }
  initializeProjectCommand.credentials = mockCredentials
  initializeProjectCommand.environment = mockEnvironment
  initializeProjectCommand.commandObject = mockCommand
  initializeProjectCommand.provider = mockProvider
  initializeProjectCommand.questions = mockQuestions
  initializeProjectCommand.generateEnvironmentConfiguration()
})

test('generateParameters creates json string and echoes it to config file', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const params = {
    appName: 'testName',
    shell: 'testShell'
  }
  const mockCommandObject = {
    inputs: {
      projectName: 'testName',
      projectShell: 'testShell'
    },
    executeCommand: (command, successMessage, errorMessage, callback) => {
      expect(command).toEqual('echo ' + JSON.stringify(params) + ' > ./config/parameters.json')
      expect(successMessage.length).toBeGreaterThan(0)
      expect(errorMessage.length).toBeGreaterThan(0)
      expect(callback).toBeUndefined()
      done()
    }
  }

  initializeProjectCommand.commandObject = mockCommandObject
  initializeProjectCommand.generateParameters()
})

test('generateConfiguration creates json string and echoes it to config file', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockCommandObject = {
    closeInputStream: () => 'test',
    executeCommand: (command, successMessage, errorMessage, callbackFunc) => {
      expect(command).toEqual('echo ' + JSON.stringify(mockCredentials) + ' > ./config/credentials.json')
      expect(successMessage.length).toBeGreaterThan(0)
      expect(errorMessage.length).toBeGreaterThan(0)
      callbackFunc()
    }
  }
  const mockGenerateParameters = () => done()
  const mockCredentials = { environments: { test: {} } }
  initializeProjectCommand.credentials = mockCredentials
  initializeProjectCommand.generateParameters = mockGenerateParameters
  initializeProjectCommand.commandObject = mockCommandObject
  initializeProjectCommand.generateConfiguration()
})

test('shell answer validates', (done) => {
  let initializeProjectCommand = Object.assign({}, testInitializeProjectCommand)
  const mockCommandObject = {
    printMessage: (message) => {
      expect(message).toEqual('Invalid selection')
      done()
    }
  }
  const mockQuestions = () => 'testcall'
  initializeProjectCommand.commandObject = mockCommandObject
  initializeProjectCommand.questions = mockQuestions
  initializeProjectCommand.validateShell('bash')
  initializeProjectCommand.validateShell('powershell')
  initializeProjectCommand.validateShell('invalid')
})
