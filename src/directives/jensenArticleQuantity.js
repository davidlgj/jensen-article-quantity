angular.module('jensenArticleQuantity').directive('jensenArticleQuantity',
['twsApi.Jed', 'twsArticleService.ArticleService', '$q', 'twsApi.Locale',
 'twsApi.Select', '$injector',
  function(jed, ArticleService, $q, locale, sel, $injector) {
  'use strict';
  return {
    restrict: 'E',
    scope: {
      'articleUid': '=articleUid'
    },
    templateUrl: 'jensen-article-quantity/templates/jensenArticleQuantity.html',
    link: function(scope, element, attrs) { //jshint ignore:line

      // Isolated scope hides this from us.
      jed(scope, 'tws-article-quantity');
      scope.lang = locale.language();

      const watchGlobal = sel(
        'globalSettings.twsBuyButton.watchItemEnabled',
        $injector.get('themeSettings')
      );
      scope.watchItemEnabled = false;
      if (typeof watchGlobal === 'boolean') {
        scope.watchItemEnabled = watchGlobal;
      }

      scope.$watch('articleUid', function(value) {
        if (!value) { return; }

        ArticleService.update(scope.articleUid).then(function(articleData) {
          console.warn(articleData)
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


            // JENSEN: Added quantity options
            // They are hardcoded to 50 cm per unit of quantity
            scope.quantityOptions = [];
            const max = org.maximum || 1;
            for (let i = 1; i <= max; i++) {
              scope.quantityOptions.push({
                name: `${i * 50} cm (Val ${i})`,
                value: i,
              });
            }
          }
        });
      });

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
