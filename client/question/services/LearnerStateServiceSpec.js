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
 * @fileoverview Unit tests for the LearnerStateService.
 */

describe('LearnerStateService', function() {
  var LearnerStateService;

  beforeEach(module('tie'));
  beforeEach(inject(function($injector) {
    LearnerStateService = $injector.get('LearnerStateService');
  }));

  describe('language unfamiliarity error detection', function() {
    it('should record when enough consecutive errors are detected', function() {
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      LearnerStateService.recordSyntaxError();
      LearnerStateService.recordPrereqWrongLanguageError();
      LearnerStateService.recordSyntaxError();
      LearnerStateService.recordPrereqWrongLanguageError();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      LearnerStateService.recordPrereqWrongLanguageError();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(true);

      LearnerStateService.recordPrereqWrongLanguageError();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(true);
    });

    it('should reset counters correctly', function() {
      LearnerStateService.recordSyntaxError();
      LearnerStateService.recordPrereqWrongLanguageError();
      LearnerStateService.recordSyntaxError();
      LearnerStateService.recordPrereqWrongLanguageError();
      LearnerStateService.recordPrereqWrongLanguageError();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(true);

      LearnerStateService.resetLanguageUnfamiliarityCounters();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);
    });

    it('should reset when other types of errors are encountered', function() {
      LearnerStateService.recordSyntaxError();
      LearnerStateService.recordPrereqWrongLanguageError();
      LearnerStateService.recordSyntaxError();
      LearnerStateService.recordPrereqWrongLanguageError();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      // Now, recording a fifth wrong-language error shouldn't trigger the
      // counter, because the consecutive streak is broken.
      LearnerStateService.recordPrereqWrongLanguageError();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);
    });
  });

  describe('consecutive runtime error detection', function() {
    it('should record when enough consecutive errors are detected', function() {
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(true);

      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(true);
    });

    it('should reset counters correctly', function() {
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(true);

      LearnerStateService.resetLanguageUnfamiliarityCounters();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);
    });

    it('should reset when other types of errors are encountered', function() {
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      LearnerStateService.recordSyntaxError();
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      // Now, recording a fifth runtime error shouldn't trigger the
      // counter, because the consecutive streak is broken.
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);
    });

    it('should reset when a different runtime error is seen', function() {
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      LearnerStateService.recordRuntimeError('runtime error 2');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      // Now, recording a fifth runtime error of the old type shouldn't trigger
      // the counter, because the consecutive streak is broken.
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);

      // Four more runtime errors of the old type are needed to trigger the
      // streak.
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(false);
      LearnerStateService.recordRuntimeError('runtime error');
      expect(
        LearnerStateService.doesUserNeedLanguageUnfamiliarityPrompt()
      ).toBe(true);
    });
  });
});
