// Copyright 2017 The TIE Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for ConversationManagerService.
 */

describe('ConversationManagerService', function() {
  var SUPPORTED_PYTHON_LIBS;
  var ConversationManagerService;
  var CurrentQuestionService;
  var QuestionObjectFactory;
  var TaskObjectFactory;
  var question;
  var orderedTasks;
  var auxiliaryCode;
  var starterCode;
  var FEEDBACK_TYPE_INPUT_TO_TRY;
  var FEEDBACK_TYPE_OUTPUT_ENABLED;
  var CORRECTNESS_FEEDBACK_TEXT;
  var TITLE = "title";
  var STARTER_CODE = "starterCode";
  var AUXILIARY_CODE = "auxiliaryCode";
  var taskDict = [{
    instructions: [''],
    prerequisiteSkills: [''],
    acquiredSkills: [''],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'mockMainFunction',
    languageSpecificTips: {
      python: []
    },
    testSuites: [{
      id: 'GENERAL_CASE',
      humanReadableName: 'the general case',
      testCases: [{
        input: 'task_1_correctness_test_1',
        allowedOutputs: [true]
      }, {
        input: 'task_1_correctness_test_2',
        allowedOutputs: [true]
      }]
    }],
    buggyOutputTests: [{
      buggyFunctionName: 'AuxiliaryCode.mockAuxiliaryCodeOne',
      ignoredTestSuiteIds: [],
      messages: [
        "Mock BuggyOutputTest Message One for task1",
        "Mock BuggyOutputTest Message Two for task1",
        "Mock BuggyOutputTest Message Three for task1"
      ]
    }],
    suiteLevelTests: [],
    performanceTests: []
  }, {
    instructions: [''],
    prerequisiteSkills: [''],
    acquiredSkills: [''],
    inputFunctionName: null,
    outputFunctionName: null,
    mainFunctionName: 'mockMainFunction',
    languageSpecificTips: {
      python: []
    },
    testSuites: [{
      id: 'GENERAL_CASE',
      humanReadableName: 'the general case',
      testCases: [{
        input: 'task_2_correctness_test_1',
        allowedOutputs: [false]
      }, {
        input: 'task_2_correctness_test_2',
        allowedOutputs: [false]
      }]
    }],
    buggyOutputTests: [{
      buggyFunctionName: 'AuxiliaryCode.mockAuxiliaryCodeTwo',
      ignoredTestSuiteIds: [],
      messages: [
        "Mock BuggyOutputTest Message One for task2",
        "Mock BuggyOutputTest Message Two for task2",
        "Mock BuggyOutputTest Message Three for task2"
      ]
    }],
    suiteLevelTests: [],
    performanceTests: []
  }];

  beforeEach(module('tie'));

  // Mock tasks for preprocessing.
  beforeEach(inject(function($injector) {
    ConversationManagerService = $injector.get('ConversationManagerService');
    TaskObjectFactory = $injector.get('TaskObjectFactory');
    SUPPORTED_PYTHON_LIBS = $injector.get('SUPPORTED_PYTHON_LIBS');
    FEEDBACK_TYPE_INPUT_TO_TRY = $injector.get('FEEDBACK_TYPE_INPUT_TO_TRY');
    FEEDBACK_TYPE_OUTPUT_ENABLED = $injector.get(
      'FEEDBACK_TYPE_OUTPUT_ENABLED');
    CORRECTNESS_FEEDBACK_TEXT = $injector.get('CORRECTNESS_FEEDBACK_TEXT');
    QuestionObjectFactory = $injector.get(
      'QuestionObjectFactory');
    CurrentQuestionService = $injector.get('CurrentQuestionService');
    question = QuestionObjectFactory.create({
      title: TITLE,
      starterCode: STARTER_CODE,
      auxiliaryCode: AUXILIARY_CODE,
      tasks: taskDict
    });
    spyOn(
      CurrentQuestionService, 'getCurrentQuestion').and.returnValue(question);

    orderedTasks = taskDict.map(function(task) {
      return TaskObjectFactory.create(task);
    });

    auxiliaryCode = [
      'class AuxiliaryCode(object):',
      '    @classmethod',
      '    def mockAuxiliaryCodeOne(cls, input):',
      '        return input.endswith("1")',
      '    @classmethod',
      '    def mockAuxiliaryCodeTwo(cls, input):',
      '        return False'
    ].join('\n');

    starterCode = [
      'def mockMainFunction(input):',
      '    return True'
    ].join('\n');
  }));

  describe('processSolutionAsync', function() {
    describe('correctness tests', function() {
      it('should check both task1 and task2 to ' +
          'verify that the learner has the correct answer', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    if len(input) > 0 and input[:6] == "task_1":',
          '        return True',
          '    return False'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(true);
          expect(stdout).toBe('');
          done();
        });
      });

      it('should contain the correct stdout upon question ' +
          'completion', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    print(input)',
          '    if len(input) > 0 and input[:6] == "task_1":',
          '        return True',
          '    return False'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(true);
          expect(stdout).toBe('task_2_correctness_test_2\n');
          done();
        });
      });

      it('should check both task1 and task2 to ' +
          'verify that the learner fails on task1', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    if len(input) > 0 and input == "task_1_correctness_test_1":',
          '        return True',
          '    return False'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[1].getContent()).toEqual(
              "Input: \"task_1_correctness_test_2\"");
          expect(stdout).toBe('');
          done();
        });
      });

      it('should contain the correct stdout for task completion',
        function(done) {
          var studentCode = [
            'def mockMainFunction(input):',
            '    print(input)',
            '    if len(input) > 0 and input == "task_1_correctness_test_1":',
            '        return True',
            '    return False'
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode,
            auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult) {
            var feedback = learnerViewSubmissionResult.getFeedback();
            var stdout = learnerViewSubmissionResult.getStdout();
            expect(feedback.isAnswerCorrect()).toEqual(false);
            expect(feedback.getParagraphs()[1].getContent()).toEqual(
                "Input: \"task_1_correctness_test_2\"");
            expect(stdout).toBe('task_1_correctness_test_2\n');
            done();
          });
        });

      it('should check both task1 and task2 to ' +
          'verify that the learner fails on task2', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    if len(input) > 0 and input == "task_2_correctness_test_2":',
          '        return False',
          '    return True'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[1].getContent()).toEqual(
             "Input: \"task_2_correctness_test_1\"");
          expect(stdout).toBe('');
          done();
        });
      });

      it('should contain the correct stdout if first test of second ' +
          'task failed', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    print(input)',
          '    if len(input) > 0 and input == "task_2_correctness_test_2":',
          '        return False',
          '    return True'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[1].getContent()).toEqual(
             "Input: \"task_2_correctness_test_1\"");
          expect(stdout).toBe('task_2_correctness_test_1\n');
          done();
        });
      });

      it('should check both task1 and task2, ' +
          'and though learner fails on both tasks, ' +
          'error message of task1 is displayed', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    if len(input) > 0 and input[-1] == "1":',
          '        return False',
          '    return True'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[1].getContent()).toEqual(
              "Input: \"task_1_correctness_test_1\"");
          expect(stdout).toBe('');
          done();
        });
      });

      it('should contain the correct stdout if first test failed',
        function(done) {
          var studentCode = [
            'def mockMainFunction(input):',
            '    print(input)',
            '    if len(input) > 0 and input[-1] == "1":',
            '        return False',
            '    return True'
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode,
            auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult) {
            var feedback = learnerViewSubmissionResult.getFeedback();
            var stdout = learnerViewSubmissionResult.getStdout();
            expect(feedback.isAnswerCorrect()).toEqual(false);
            expect(feedback.getParagraphs()[1].getContent()).toEqual(
                "Input: \"task_1_correctness_test_1\"");
            expect(stdout).toBe('task_1_correctness_test_1\n');
            done();
          });
        });
    });

    describe('buggy output tests', function() {
      it('should check both task1 and task2 to ' +
          'verify that the learner fails on task1', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    return input.endswith("1")'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[0].getContent()).toEqual(
             "Mock BuggyOutputTest Message One for task1");
          expect(stdout).toBe('');
          done();
        });
      });

      it('should check both task1 and task2, ' +
          'though learner fails on task2 buggy tests, ' +
          'error message of task1 is displayed', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    return False'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[1].getContent()).toEqual(
             "Input: \"task_1_correctness_test_1\"");
          expect(stdout).toBe('');
          done();
        });
      });

      it('should display a new message only if the code changes',
        function(done) {
          var studentCode1 = [
            'def mockMainFunction(input):',
            '    return input.endswith("1")'
          ].join('\n');
          var studentCode2 = [
            'def mockMainFunction(input):',
            '    return input.endswith("1") or input.endswith("1")'
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode1,
            auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult1) {
            var feedback1 = learnerViewSubmissionResult1.getFeedback();
            var stdout1 = learnerViewSubmissionResult1.getStdout();
            expect(feedback1.isAnswerCorrect()).toEqual(false);
            expect(feedback1.getParagraphs()[0].getContent()).toEqual(
               'Mock BuggyOutputTest Message One for task1');
            expect(stdout1).toBe('');

            ConversationManagerService.processSolutionAsync(
              orderedTasks, starterCode, studentCode1,
              auxiliaryCode, 'python'
            ).then(function(learnerViewSubmissionResult2) {
              var feedback2 = learnerViewSubmissionResult2.getFeedback();
              var stdout2 = learnerViewSubmissionResult2.getStdout();
              expect(feedback2.isAnswerCorrect()).toEqual(false);
              // The code has not changed, so the message stays the same.
              expect(feedback2.getParagraphs()[0].getContent()).toEqual(
                'Mock BuggyOutputTest Message One for task1');
              expect(stdout2).toBe('');

              ConversationManagerService.processSolutionAsync(
                orderedTasks, starterCode, studentCode2,
                auxiliaryCode, 'python'
              ).then(function(learnerViewSubmissionResult3) {
                var feedback3 = learnerViewSubmissionResult3.getFeedback();
                var stdout3 = learnerViewSubmissionResult3.getStdout();
                expect(feedback3.isAnswerCorrect()).toEqual(false);
                // The code has changed, so the message changes.
                expect(feedback3.getParagraphs()[0].getContent()).toEqual(
                  'Mock BuggyOutputTest Message Two for task1');
                expect(stdout3).toBe('');
                done();
              });
            });
          });
        }
      );

      it([
        'should return correctness feedback if a student reaches the end of ',
        'the available hints.'
      ].join(''), function(done) {
        var wrongStudentCodeAlternative1 = [
          'def mockMainFunction(input):',
          '    return input.endswith("1")'
        ].join('\n');
        var wrongStudentCodeAlternative2 = [
          'def mockMainFunction(input):',
          '    return input.endswith("1") or input.endswith("1")'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, wrongStudentCodeAlternative1,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult1) {
          var feedback1 = learnerViewSubmissionResult1.getFeedback();
          var stdout1 = learnerViewSubmissionResult1.getStdout();
          expect(feedback1.isAnswerCorrect()).toEqual(false);
          expect(feedback1.getParagraphs()[0].getContent()).toEqual(
             'Mock BuggyOutputTest Message One for task1');
          expect(stdout1).toBe('');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, wrongStudentCodeAlternative2,
            auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult2) {
            var feedback2 = learnerViewSubmissionResult2.getFeedback();
            var stdout2 = learnerViewSubmissionResult2.getStdout();
            expect(feedback2.isAnswerCorrect()).toEqual(false);
            expect(feedback2.getParagraphs()[0].getContent()).toEqual(
              'Mock BuggyOutputTest Message Two for task1');
            expect(stdout2).toBe('');

            ConversationManagerService.processSolutionAsync(
              orderedTasks, starterCode, wrongStudentCodeAlternative1,
              auxiliaryCode, 'python'
            ).then(function(learnerViewSubmissionResult3) {
              var feedback3 = learnerViewSubmissionResult3.getFeedback();
              var stdout3 = learnerViewSubmissionResult3.getStdout();
              expect(feedback3.isAnswerCorrect()).toEqual(false);
              expect(feedback3.getParagraphs()[0].getContent()).toEqual(
                'Mock BuggyOutputTest Message Three for task1');
              expect(stdout3).toBe('');

              ConversationManagerService.processSolutionAsync(
                orderedTasks, starterCode, wrongStudentCodeAlternative2,
                auxiliaryCode, 'python'
              ).then(function(learnerViewSubmissionResult4) {
                var feedback4 = learnerViewSubmissionResult4.getFeedback();
                var stdout4 = learnerViewSubmissionResult4.getStdout();
                expect(feedback4.isAnswerCorrect()).toEqual(false);
                // At this point, we have run out of buggy-output test feedback.
                expect(
                  CORRECTNESS_FEEDBACK_TEXT[FEEDBACK_TYPE_INPUT_TO_TRY]
                ).toContain(feedback4.getParagraphs()[0].getContent());
                expect(stdout4).toBe('');
                done();
              });
            });
          });
        });
      });

      it([
        'should return the same hint multiple times for buggy outputs, ',
        'provided a new error happened in between'
      ].join(''), function(done) {
        var buggyOutputStudentCode = [
          'def mockMainFunction(input):',
          '    return input.endswith("1")'
        ].join('\n');
        var runtimeErrorStudentCode = [
          'def mockMainFunction(input):',
          '    return 5 / 0'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, buggyOutputStudentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult1) {
          var feedback1 = learnerViewSubmissionResult1.getFeedback();
          expect(feedback1.isAnswerCorrect()).toEqual(false);
          expect(feedback1.getParagraphs()[0].getContent()).toEqual(
             'Mock BuggyOutputTest Message One for task1');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, runtimeErrorStudentCode,
            auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult2) {
            var feedback2 = learnerViewSubmissionResult2.getFeedback();
            expect(feedback2.isAnswerCorrect()).toEqual(false);
            expect(feedback2.getParagraphs()[0].getContent()).toEqual([
              'Looks like your code had a runtime error when evaluating the ',
              'input "task_1_correctness_test_1".'
            ].join(''));

            ConversationManagerService.processSolutionAsync(
              orderedTasks, starterCode, buggyOutputStudentCode,
              auxiliaryCode, 'python'
            ).then(function(learnerViewSubmissionResult3) {
              var feedback3 = learnerViewSubmissionResult3.getFeedback();
              expect(feedback3.isAnswerCorrect()).toEqual(false);
              // The cycle is broken, so we start from the top of the
              // buggy-message list.
              expect(feedback3.getParagraphs()[0].getContent()).toEqual(
                'Mock BuggyOutputTest Message One for task1');
              done();
            });
          });
        });
      });
    });

    describe("prereqCheckFailures", function() {
      it('should return the correct feedback if there is code in global scope',
        function(done) {
          var studentCode = [
            'def mockMainFunction(input):',
            '    return input',
            'mockMainFunction("input")'
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode,
            auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult) {
            var feedback = learnerViewSubmissionResult.getFeedback();
            var stdout = learnerViewSubmissionResult.getStdout();
            expect(feedback.isAnswerCorrect()).toEqual(false);
            expect(feedback.getParagraphs()[0].getContent()).toEqual([
              'Please keep your code within the existing predefined functions ',
              'or define your own helper functions if you need to ',
              '-- we cannot process code in the global scope.'
            ].join(' '));
            expect(stdout).toBe(null);
            done();
          });
        }
      );

      it('should be correctly handled if missing starter code', function(done) {
        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, '',
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[0].getContent()).toEqual([
            'It looks like you deleted or modified the starter code!  Our ',
            'evaluation program requires the function names given in the ',
            'starter code.  You can press the \'Reset Code\' button to start ',
            'over.  Or, you can copy the starter code below:'
          ].join(''));
          expect(feedback.getParagraphs()[1].getContent()).toEqual(starterCode);
          expect(stdout).toBe(null);
          done();
        });
      });

      it('should be correctly handled if has bad import', function(done) {
        var studentCode = [
          'import pandas',
          'def mockMainFunction(input):',
          '    return True'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[0].getContent()).toEqual([
            "It looks like you're importing an external library. However, the ",
            'following libraries are not supported:\n'
          ].join(''));
          expect(feedback.getParagraphs()[1].getContent()).toEqual('pandas');
          expect(feedback.getParagraphs()[2].getContent()).toEqual(
            'Here is a list of libraries we currently support:\n');
          expect(feedback.getParagraphs()[3].getContent()).toEqual(
            SUPPORTED_PYTHON_LIBS.join(', '));
          expect(stdout).toBe(null);
          done();
        });
      });

      it('should return 1st errorLineNumber, when multiple errors',
        function(done) {
          var studentCode = [
            'def mockMainFunction(input):',
            '    return True',
            'def myFunction(arg):',
            '    arg = arg / 2',
            '    arg--',
            '    return arg',
            'def myFunction2(arg):',
            '    arg++',
            '    return arg',
            ''
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode,
            auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult) {
            var feedback = learnerViewSubmissionResult.getFeedback();
            var stdout = learnerViewSubmissionResult.getStdout();
            expect(feedback.isAnswerCorrect()).toEqual(false);
            expect(feedback.getErrorLineNumber()).toBe(5);
            expect(stdout).toBe(null);
            done();
          });
        });
    });

    describe('potentialSyntaxError', function() {
      it('should correctly handle a syntax error', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    return True -'
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.isAnswerCorrect()).toEqual(false);
          expect(feedback.getParagraphs()[1].getContent().startsWith(
            'SyntaxError:')).toEqual(true);
          expect(stdout).toBe(null);
          done();
        });
      });
    });

    describe('should return the correct feedback if', function() {
      it('there is a stack exceeded error', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    return mockMainFunction(input)',
          ''
        ].join('\n');
        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.getParagraphs()[0].getContent()).toEqual([
            "Your code appears to be hitting an infinite recursive loop. ",
            "Check to make sure that your recursive calls terminate."
          ].join(''));
          expect(stdout).toBe(null);
          done();
        });
      });

      it('there is a runtime error', function(done) {
        var studentCode = [
          'def mockMainFunction(input):',
          '    return greeting',
          ''
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(
            feedback.getParagraphs()[0].getContent().startsWith(
                'It looks like greeting isn\'t a declared variable.')
          ).toBe(true);
          expect(stdout).toBe(null);
          done();
        });
      });
    });

    describe('buggy output ignored test suites', function() {
      beforeEach(inject(function() {
        // Reconfigure the test suites for the first task.
        taskDict[0].testSuites = [{
          id: 'SUITE1',
          humanReadableName: 'suite 1',
          testCases: [{
            input: 'task_1_suite_1_test_1',
            allowedOutputs: [true]
          }, {
            input: 'task_1_suite_1_test_2',
            allowedOutputs: [true]
          }]
        }, {
          id: 'SUITE2',
          humanReadableName: 'suite 2',
          testCases: [{
            input: 'task_1_suite_2_test_1',
            allowedOutputs: [false]
          }, {
            input: 'task_1_suite_2_test_2',
            allowedOutputs: [false]
          }]
        }];
        question = QuestionObjectFactory.create({
          title: TITLE,
          starterCode: STARTER_CODE,
          auxiliaryCode: AUXILIARY_CODE,
          tasks: taskDict
        });
        CurrentQuestionService.getCurrentQuestion =
          jasmine.createSpy().and.returnValue(question);
      }));

      it('should check all buggy outputs if nothing is ignored',
        function(done) {
          taskDict[0].buggyOutputTests[0].ignoredTestSuiteIds = [];
          orderedTasks = taskDict.map(function(task) {
            return TaskObjectFactory.create(task);
          });

          // The buggy function returns True for the first and third cases.
          // The student's code returns True in the first three cases and False
          // in the fourth.
          var studentCode = [
            'def mockMainFunction(input):',
            '    return input != "task_1_suite_2_test_2"',
            ''
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode, auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult) {
            var feedback = learnerViewSubmissionResult.getFeedback();
            var stdout = learnerViewSubmissionResult.getStdout();
            expect(
              CORRECTNESS_FEEDBACK_TEXT[FEEDBACK_TYPE_INPUT_TO_TRY]).toContain(
              feedback.getParagraphs()[0].getContent());
            expect(stdout).toBe('');
            done();
          });
        }
      );

      it('should ignore buggy outputs for ignored suite ids', function(done) {
        taskDict[0].buggyOutputTests[0].ignoredTestSuiteIds = ['SUITE2'];
        orderedTasks = taskDict.map(function(task) {
          return TaskObjectFactory.create(task);
        });

        // The buggy function returns True for the first and third cases.
        // The student's code returns True in the first case and False for the
        // rest.
        var studentCode = [
          'def mockMainFunction(input):',
          '    return input in [',
          '        "task_1_suite_1_test_1", "task_2_correctness_test_1"]',
          ''
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode, auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.getParagraphs()[0].getContent()).toBe(
            'Mock BuggyOutputTest Message One for task1');
          expect(stdout).toBe('');
          done();
        });
      });
    });

    describe('suite-level tests', function() {
      beforeEach(inject(function() {
        // Reconfigure the test suites, buggy output tests and suite-level
        // tests for the first task.
        taskDict[0].testSuites = [{
          id: 'SUITE1',
          humanReadableName: 'suite 1',
          testCases: [{
            input: 'task_1_suite_1_test_1',
            allowedOutputs: [true]
          }, {
            input: 'task_1_suite_1_test_2',
            allowedOutputs: [false]
          }]
        }, {
          id: 'SUITE2',
          humanReadableName: 'suite 2',
          testCases: [{
            input: 'task_1_suite_2_test_1',
            allowedOutputs: [false]
          }, {
            input: 'task_1_suite_2_test_2',
            allowedOutputs: [false]
          }]
        }];
        taskDict[0].buggyOutputTests = [];
        taskDict[0].suiteLevelTests = [{
          testSuiteIdsThatMustPass: ['SUITE1'],
          testSuiteIdsThatMustFail: ['SUITE2'],
          messages: ['suite_message1', 'suite_message2']
        }];
        question = QuestionObjectFactory.create({
          title: TITLE,
          starterCode: STARTER_CODE,
          auxiliaryCode: AUXILIARY_CODE,
          tasks: taskDict
        });
        CurrentQuestionService.getCurrentQuestion =
          jasmine.createSpy().and.returnValue(question);
      }));

      it('should return suite-level feedback if the condition is triggered',
        function(done) {
          orderedTasks = taskDict.map(function(task) {
            return TaskObjectFactory.create(task);
          });

          // This code passes suite 1 and fails suite 2.
          var studentCode = [
            'def mockMainFunction(input):',
            '    return input.endswith("1")',
            ''
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode, auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult) {
            var feedback = learnerViewSubmissionResult.getFeedback();
            var stdout = learnerViewSubmissionResult.getStdout();
            expect(feedback.getParagraphs()[0].getContent()).toBe(
              'suite_message1');
            expect(stdout).toBe('');
            done();
          });
        }
      );

      it([
        'should not return suite-level feedback if the passing-suite ',
        ' prerequisites do not hold'
      ].join(''), function(done) {
        orderedTasks = taskDict.map(function(task) {
          return TaskObjectFactory.create(task);
        });

        // This code passes one test case in suite 1 and fails the other, thus
        // failing the suite.
        var studentCode = [
          'def mockMainFunction(input):',
          '    return True',
          ''
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode, auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(
            CORRECTNESS_FEEDBACK_TEXT[FEEDBACK_TYPE_INPUT_TO_TRY]).toContain(
            feedback.getParagraphs()[0].getContent());
          expect(stdout).toBe('');
          done();
        });
      });

      it([
        'should consider a suite failed if at least one test in it fails'
      ].join(''), function(done) {
        orderedTasks = taskDict.map(function(task) {
          return TaskObjectFactory.create(task);
        });

        // This code passes suite 1, and passes one of the two tests in suite 2.
        var studentCode = [
          'def mockMainFunction(input):',
          '    return input.endswith("1")',
          ''
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode, auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult) {
          var feedback = learnerViewSubmissionResult.getFeedback();
          var stdout = learnerViewSubmissionResult.getStdout();
          expect(feedback.getParagraphs()[0].getContent()).toBe(
            'suite_message1');
          expect(stdout).toBe('');
          done();
        });
      });

      it([
        'should return the next hint in sequence for suite-level tests, but ',
        'only if the code has been changed'
      ].join(''), function(done) {
        orderedTasks = taskDict.map(function(task) {
          return TaskObjectFactory.create(task);
        });

        // This code passes suite 1, and fails suite 2.
        var studentCode1 = [
          'def mockMainFunction(input):',
          '    return input.endswith("1")',
          ''
        ].join('\n');

        // This code also passes suite 1, and fails suite 2.
        var studentCode2 = [
          'def mockMainFunction(input):',
          '    return input.endswith("1") or input.endswith("1")',
          ''
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode1, auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult1) {
          var feedback = learnerViewSubmissionResult1.getFeedback();
          expect(feedback.getParagraphs()[0].getContent()).toBe(
            'suite_message1');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode1, auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult2) {
            feedback = learnerViewSubmissionResult2.getFeedback();
            expect(feedback.getParagraphs()[0].getContent()).toBe(
              'suite_message1');

            ConversationManagerService.processSolutionAsync(
              orderedTasks, starterCode, studentCode2, auxiliaryCode, 'python'
            ).then(function(learnerViewSubmissionResult3) {
              feedback = learnerViewSubmissionResult3.getFeedback();
              expect(feedback.getParagraphs()[0].getContent()).toBe(
                'suite_message2');
              done();
            });
          });
        });
      });

      it([
        'should return incorrect-output feedback if a student reaches the end ',
        'of the hints.'
      ].join(''), function(done) {
        orderedTasks = taskDict.map(function(task) {
          return TaskObjectFactory.create(task);
        });

        // This code passes suite 1, and fails suite 2.
        var studentCode1 = [
          'def mockMainFunction(input):',
          '    return input.endswith("1")',
          ''
        ].join('\n');

        // This code also passes suite 1, and fails suite 2.
        var studentCode2 = [
          'def mockMainFunction(input):',
          '    return input.endswith("1") or input.endswith("1")',
          ''
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, studentCode1, auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult1) {
          var feedback = learnerViewSubmissionResult1.getFeedback();
          expect(feedback.getParagraphs()[0].getContent()).toBe(
            'suite_message1');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode2, auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult2) {
            feedback = learnerViewSubmissionResult2.getFeedback();
            expect(feedback.getParagraphs()[0].getContent()).toBe(
              'suite_message2');

            ConversationManagerService.processSolutionAsync(
              orderedTasks, starterCode, studentCode1, auxiliaryCode, 'python'
            ).then(function(learnerViewSubmissionResult3) {
              feedback = learnerViewSubmissionResult3.getFeedback();
              // We've reached the end of the hints.
              expect(
                CORRECTNESS_FEEDBACK_TEXT[FEEDBACK_TYPE_INPUT_TO_TRY]
              ).toContain(feedback.getParagraphs()[0].getContent());
              done();
            });
          });
        });
      });

      it([
        'should reset the suite-level counter if other types of feedback are ',
        'given in between'
      ].join(''), function(done) {
        orderedTasks = taskDict.map(function(task) {
          return TaskObjectFactory.create(task);
        });

        // This code passes suite 1, and fails suite 2.
        var suiteLevelFailureStudentCode = [
          'def mockMainFunction(input):',
          '    return input.endswith("1")',
          ''
        ].join('\n');

        // This code leads to a runtime error.
        var runtimeErrorStudentCode = [
          'def mockMainFunction(input):',
          '    return 5 / 0',
          ''
        ].join('\n');

        ConversationManagerService.processSolutionAsync(
          orderedTasks, starterCode, suiteLevelFailureStudentCode,
          auxiliaryCode, 'python'
        ).then(function(learnerViewSubmissionResult1) {
          var feedback = learnerViewSubmissionResult1.getFeedback();
          expect(feedback.getParagraphs()[0].getContent()).toBe(
            'suite_message1');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, runtimeErrorStudentCode, auxiliaryCode,
            'python'
          ).then(function(learnerViewSubmissionResult2) {
            feedback = learnerViewSubmissionResult2.getFeedback();
            expect(feedback.getParagraphs()[0].getContent()).toBe([
              'Looks like your code had a runtime error when evaluating the ',
              'input "task_1_suite_1_test_1".'
            ].join(''));

            ConversationManagerService.processSolutionAsync(
              orderedTasks, starterCode, suiteLevelFailureStudentCode,
              auxiliaryCode, 'python'
            ).then(function(learnerViewSubmissionResult3) {
              feedback = learnerViewSubmissionResult3.getFeedback();
              // We start again at the beginning of the suite-level hints.
              expect(feedback.getParagraphs()[0].getContent()).toBe(
                'suite_message1');
              done();
            });
          });
        });
      });
    });

    describe('incorrect-output tests', function() {
      beforeEach(inject(function() {
        taskDict[0].testSuites = [{
          id: 'SAMPLE_INPUT',
          humanReadableName: 'sampleInputSuite',
          testCases: [{
            input: 'Hello, John',
            allowedOutputs: ['olleH, nhoJ']
          }]
        }];
        question = QuestionObjectFactory.create({
          title: TITLE,
          starterCode: STARTER_CODE,
          auxiliaryCode: AUXILIARY_CODE,
          tasks: taskDict
        });
        CurrentQuestionService.getCurrentQuestion =
          jasmine.createSpy().and.returnValue(question);
      }));

      it('should allow user to display output if suite id is \'SAMPLE_INPUT\'',
        function(done) {
          orderedTasks = taskDict.map(function(task) {
            return TaskObjectFactory.create(task);
          });

          // This code passes suite 1 and fails suite 2.
          var studentCode = [
            'def mockMainFunction(input):',
            '    return "incorrect answer"',
            ''
          ].join('\n');

          ConversationManagerService.processSolutionAsync(
            orderedTasks, starterCode, studentCode, auxiliaryCode, 'python'
          ).then(function(learnerViewSubmissionResult) {
            var feedback = learnerViewSubmissionResult.getFeedback();
            var correctnessFeedbackParagraphs = feedback.getParagraphs();
            expect(correctnessFeedbackParagraphs.length).toEqual(2);
            expect(correctnessFeedbackParagraphs[0].isTextParagraph()).toEqual(
              true);
            expect(
              CORRECTNESS_FEEDBACK_TEXT[FEEDBACK_TYPE_OUTPUT_ENABLED]
            ).toContain(correctnessFeedbackParagraphs[0].getContent());
            expect(
              correctnessFeedbackParagraphs[1].isOutputParagraph()
            ).toEqual(true);

            var expectedOutputParagraph =
              'Input: "Hello, John"\n' +
              'Expected Output: "olleH, nhoJ"\n' +
              'Actual Output: "incorrect answer"';
            expect(correctnessFeedbackParagraphs[1].getContent()).toEqual(
              expectedOutputParagraph);
            done();
          });
        }
      );
    });
  });
});
