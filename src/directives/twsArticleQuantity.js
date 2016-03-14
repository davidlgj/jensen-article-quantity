angular.module('twsArticleQuantity').directive('twsArticleQuantity',
['twsApi.Jed', 'twsArticleService.ArticleService', '$q', 'twsApi.Locale',
  function(jed, ArticleService, $q, locale) {
  'use strict';
  return {
    restrict: 'E',
    scope: {
      'articleUid': '=articleUid'
    },
    templateUrl: 'tws-article-quantity/templates/twsArticleQuantity.html',
    link: function(scope, element, attrs) { //jshint ignore:line

      // Isolated scope hides this from us.
      jed(scope, 'tws-article-quantity');
      scope.lang = locale.language();

      scope.$watch('articleUid', function(value) {
        if (!value) { return; }

        ArticleService.update(scope.articleUid).then(function(articleData) {
          scope.article = articleData.article;

          if (scope.article.choiceSchema[scope.lang].properties !== undefined) {
            scope.choices = scope.article.choiceSchema[scope.lang].properties;
            scope.originalSettings = scope.choices.quantity;
            scope.model = articleData.schemaForm.model;
            //scope.quantity = articleData.schemaForm.model.quantity;
            var org = scope.originalSettings;
            scope.settings = {
              'default': angular.isDefined(org.default) ? org.default : 1,

              'divisibleBy': angular.isDefined(org.divisibleBy) ? org.divisibleBy : 1,

              // Minumum should be user defined or at least 0 + divisibleBy or fallback to 1
              'minimum': angular.isDefined(org.default) ? org.default :
                        (angular.isDefined(org.divisibleBy) ? org.divisibleBy : 1),

              // We don't default maximum
              'maximum': org.maximum
            };

            // divisibleBy can be whatever in JSON Schema, but when it is a float that will get
            // tv4.js into trouble since it cannot validate properly due to floating point rounding
            // errors.
            // To fix this we use big.js, a smallish big number implementation.
            scope.divisibleBy = Big(scope.settings.divisibleBy); //jshint ignore:line
          }
        });
      });

      scope.undefinedToMin = (value) => {
        if (value === undefined) {
          value = scope.settings.minimum;
        }
        scope.model.quantity = value;
      };

      scope.inc = function() {
        // big can't handle undefined
        if (scope.model.quantity === undefined) {
          scope.model.quantity = scope.settings.minimum;
          return;
        }

        var q = Big(scope.model.quantity); //jshint ignore:line
        q = q.plus(scope.divisibleBy);

        if (scope.settings.maximum && q.cmp(scope.settings.maximum) === 1) {
          scope.model.quantity = scope.settings.maximum;
        } else {
          scope.model.quantity = parseFloat(q.toString());
        }
      };

      scope.dec = function() {
        // big can't handle undefined
        if (scope.model.quantity === undefined) {
          scope.model.quantity = scope.settings.minimum;
          return;
        }

        var q = Big(scope.model.quantity); //jshint ignore:line
        q = q.minus(scope.divisibleBy);

        if (scope.settings.minimum && q.cmp(scope.settings.minimum) === -1) {
          scope.model.quantity = scope.settings.minimum;
        } else {
          scope.model.quantity = parseFloat(q.toString());
        }
      };
    }
  };
}]);
