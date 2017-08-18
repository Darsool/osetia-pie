

$('.address__quickly-input-btn').on('click', function(event) {
    event.preventDefault();
    
    var address__quickly = $('.address__quickly-input').val()    


    $('.form-search').find('input').val(address__quickly);
    $('.form-search').submit();
});




function SearchAddress(map, form) {
    this._model = new SearchAddress.Model(map);
    this._formView = new SearchAddress.FormView(form);
    this._mapView = new SearchAddress.MapView(map);

    this._attachHandlers();
}

SearchAddress.prototype = {
    constructor: SearchAddress,
    _attachHandlers: function () {
        this._formView.events
            .on('searchrequest', $.proxy(this._onSearchRequest, this));
    },
    _detachHandlers: function () {
        this._formView.events
            .off();
    },
    _onSearchRequest: function (e) {
        var promise = this._model.search(e.query);

        this._mapView
            .clear();

        promise.then(
            $.proxy(this._onSearchSuccess, this),
            $.proxy(this._onSearchError, this)
        );
    },
    _onSearchSuccess: function (result) {
        if(this._model.getResult()) {
            this._mapView
                .render(result);
                // valer test


        }
        else {
            this._formView
                .showMessage("Ничего не найдено.");
        }
    },
    _onSearchError: function (e) {
        this._formView.showMessage(
            this._model.getError()
        );
    },
    getModel: function () {
        return this._formModel;
    }
};

SearchAddress.MapView = function (map) {
    this._map = map;
    this._point = null;
};

SearchAddress.MapView.prototype = {
    constructor: SearchAddress.MapView,
    render: function (results) {


        var metaData = results.metaData.geocoder,
            result = results.geoObjects.get(0),
            balloonContent = '<p><small>по запросу:</small>&nbsp;<em>' + metaData.request + '</em></p>' +
                '<p><small>найдено:</small>&nbsp;<strong>' + result.properties.get('text') + '</strong></p>';

        this._point = new ymaps.Placemark(result.geometry.getCoordinates(), {
            balloonContentBody: balloonContent
        });

        this._map.geoObjects
            .add(this._point);

        this._setMapBounds(result.properties.get('boundedBy'));


                console.log(results.geoObjects.get(0).properties._data.text)

            var city = results.geoObjects.get(0).properties._data.description.split(', ');
            var address_street_hous = results.geoObjects.get(0).properties._data.text.split(', ');
            var hous = address_street_hous[address_street_hous.length - 1];
            var street = address_street_hous[address_street_hous.length - 2];
            city = city[city.length - 1];

            $('.address__main-city-input').val(city);
            $('.address__main-street-input').val(street);
            $('.address__main-hous-input').val(hous);

        return this;
    },
    clear: function () {
        if(this._point) {
            this._map.geoObjects
                .remove(this._point);
            this._point = null;
        }

        return this;
    },
    getPoint: function () {
        return this._point;
    },
    _setMapBounds: function (bounds) {
        this._map.setBounds(bounds, {
            checkZoomRange: true,
            duration: 200,
            callback: ymaps.util.bind(this._onSetMapBounds, this)
        });
    },
    _onSetMapBounds: function () {
        this._point.balloon
            .open();
    }
};

SearchAddress.FormView = function (form) {
    this._form = form;
    this._controls = form.find('.control-group');
    this._message = form.find('.help-inline');
    this._input = form.find('.search-query');
    this.events = $({});

    this._attachHandlers();
};

SearchAddress.FormView.prototype = {
    constructor: SearchAddress.FormView,
    _attachHandlers: function () {
        this._form
            .on('submit', $.proxy(this._onFormSubmit, this));
        this._input
            .on('keydown', $.proxy(this._onInputChange, this))
            .typeahead({
                source: $.proxy(this._dataSource, this),
                items: this.getSuggestConfig().limit,
                minLength: 3
            });
    },
    _detachHandlers: function () {
        this._form
            .off("submit");
        this._input
            .off();
    },
    _onFormSubmit: function (e) {
        e.preventDefault();

        var value = this._input.val();

        if(value) {
            this.events.trigger($.Event('searchrequest', {
                query: value
            }));
        }
        else {
            this.showMessage('Задан пустой поисковый запрос.');
        }
    },
    _onInputChange: function (e) {
        this.hideMessage();
    },
    showMessage: function (text) {
        this._controls
            .addClass('error');
        this._message
            .removeClass('invisible')
            .text(text);
    },
    hideMessage: function () {
        this._controls
            .removeClass('error');
        this._message
            .addClass('invisible')
            .text('');
    },
    _dataSource: function (query, callback) {
        var config = this.getSuggestConfig(),
            request = $.extend({ query: query }, config);

        $.ajax({
            url: config.url,
            dataType: 'jsonp',
            data: request,
            context: this,
            success: function (json) {
                var results = [];

                for(var i = 0, len = json.result.length; i < len; i++) {
                    var result = json.result[i],
                        parent = result.parents && result.parents[0];

                    results.push(
                        (parent && (parent.name + ' ' + parent.type + ', ') || '') +
                        result.type + ' ' + result.name
                    );
                }

                callback(results);
            }
        });
    },
    getSuggestConfig: function () {
        return {
            url: 'http://kladr-api.ru/api.php',
            contentType: 'city',
            withParent: 1,
            limit: 5,
            token: '52024d6c472d040824000221',
            key: '6cf033712aa73a4a26db39d72ea02bb682c8e390'
        };
    }
};

SearchAddress.Model = function (map) {
    this._map = map;
    this._result = null;
    this._error = null;
};

SearchAddress.Model.prototype = {
    constructor: SearchAddress.Model,
    search: function (request) {
        var promise = ymaps.geocode(request, this.getDefaults());

        this.clear();

        promise.then(
            $.proxy(this._onSearchSuccess, this),
            $.proxy(this._onSearchFailed, this)
        );

        return promise;
    },
    clear: function () {
        this._result = null;
        this._error = null;
    },
    _onSearchSuccess: function (result) {
        this._result = result.geoObjects.get(0);
    },
    _onSearchFailed: function (error) {
        this._error = error;
    },
    getDefaults: function () {
        return {
            results: 1,
            boundedBy: this._map.getBounds()
        };
    },
    getResult: function () {
        return this._result;
    },
    getError: function () {
        return this._error;
    }
};




        // ymaps.ready(function () {
        //     var myMap = window.map = new ymaps.Map('map', {
        //             center: [55.751574, 37.573856],
        //             zoom: 9,
        //             behaviors: ['default', 'scrollZoom']
        //         }),
                
        // });
    
ymaps.ready(function () {
    // Пример реализации собственного элемента управления на основе наследования от collection.Item.
    // Элемент управления отображает название объекта, который находится в центре карты.
    var myMap = new ymaps.Map("map", {
                center: [55.739543, 37.616100],
                // center: [55.819543, 37.616100],
                zoom: 9,
                behaviors: ['default', 'scrollZoom'],
                controls: []

            }
        ),
    searchControl = new SearchAddress(myMap, $('.form-search')),
    // Создаем собственный класс.
        CustomControlClass = function (options) {
            CustomControlClass.superclass.constructor.call(this, options);
            this._$content = null;
            this._geocoderDeferred = null;
        };
    // И наследуем его от collection.Item.
    ymaps.util.augment(CustomControlClass, ymaps.collection.Item, {
        onAddToMap: function (map) {
            CustomControlClass.superclass.onAddToMap.call(this, map);
            this._lastCenter = null;
            this.getParent().getChildElement(this).then(this._onGetChildElement, this);
        },

        onRemoveFromMap: function (oldMap) {
            this._lastCenter = null;
            if (this._$content) {
                this._$content.remove();
                this._mapEventGroup.removeAll();
            }
            CustomControlClass.superclass.onRemoveFromMap.call(this, oldMap);
        },

        _onGetChildElement: function (parentDomContainer) {
            // Создаем HTML-элемент с текстом.
            this._$content = $('<div class="customControl"></div>').appendTo(parentDomContainer);
            this._mapEventGroup = this.getMap().events.group();
            // Запрашиваем данные после изменения положения карты.
            this._mapEventGroup.add('boundschange', this._createRequest, this);
            // Сразу же запрашиваем название места.
            this._createRequest();
        },

        _createRequest: function() {
            var lastCenter = this._lastCenter = this.getMap().getCenter().join(',');
            // Запрашиваем информацию о месте по координатам центра карты.
            ymaps.geocode(this._lastCenter, {
                // Указываем, что ответ должен быть в формате JSON.
                json: true,
                // Устанавливаем лимит на кол-во записей в ответе.
                results: 1
            }).then(function (result) {
                    // Будем обрабатывать только ответ от последнего запроса.
                    if (lastCenter == this._lastCenter) {
                        this._onServerResponse(result);
                    }
                }, this);
        },

        _onServerResponse: function (result) {
            // Данные от сервера были получены и теперь их необходимо отобразить.
            // Описание ответа в формате JSON.
            var members = result.GeoObjectCollection.featureMember,
                geoObjectData = (members && members.length) ? members[0].GeoObject : null;
            if (geoObjectData) {
                this._$content.text(geoObjectData.metaDataProperty.GeocoderMetaData.text);
            }
        }
    });


});