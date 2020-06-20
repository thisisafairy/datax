'use strict';

describe('Directive: addUrlDataset', function () {

  // load the directive's module
  beforeEach(module('vlui'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should show correct form', inject(function ($compile) {
    element = angular.element('<add-url-dataset></add-url-dataset>');
    element = $compile(element)(scope);

    scope.$digest();
    expect(element.find('#dataset-url').length).to.eql(1);
    expect(element.find('#dataset-name').length).to.eql(1);
  }));
});