(function () {
	angular.module('botiquin.directives', [])
		.directive('asociacionList', function () {
			return {
				restrict: 'E',
				templateUrl: 'partials/asociacion-list.html'
			};
		})
		.directive('buscarclienteDialog', function () {
			return {
				restrict: 'E',
				templateUrl: 'partials/buscarcliente-dialog.html',				
				scope: {
					name: '@name'
				},
				link: function (scope, element, attributes) {					
					scope.name = attributes.name;
				},
				controller: ['$scope', '$http', '$window', function ($scope, $http, $window) {
					var dataList = {};
					var sessionStorage = $window.sessionStorage;
					$scope.isEmpty = true;					

					var contains = function (str, searchString) {
						return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
					};

					var startsWith = function (str, searchString) {
						return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
					};		

					var filter = function (){
						$scope.isEmpty = true;
						$scope.clientes = dataList.filter(function (obj) {
							if(startsWith(obj.cedula, $scope.keyword) || contains(obj.nombre, $scope.keyword) || contains(obj.apellido, $scope.keyword)) {
								return obj;
							}
						});

						if($scope.clientes.length > 0){
							$scope.isEmpty = false;
						}
					}			
								

					$http.get('http://localhost:8000/clientes/')
						.success(function (data) {
							dataList = data;
							$scope.clientes = data;
							if(data.length>0){
								$scope.isEmpty = false;
							}
						});					


					$scope.filtrarClientes = function (event) {						
						if(!event){
							filter();							
						}else if(event.keyCode === 13){
							filter();
						}						
					};

					$scope.seleccionarCliente = function (cliente) {
						$scope.clienteSeleccionado = cliente;
					}

					$scope.guardarCliente = function () {
						sessionStorage.setItem("cliente", JSON.stringify($scope.clienteSeleccionado));
						$scope.clienteSeleccionado = {};
						$scope.keyword = '';
					}
				}]
			};
		})
		.directive('buscarproductoDialog', function () {
			return {
				restrict: 'E',
				templateUrl: 'partials/buscarproducto-dialog.html',				
				scope: {
					name: '@name'
				},
				link: function (scope, element, attributes) {					
					scope.name = attributes.name;
				},
				controller: ['$scope', '$http', '$window', function ($scope, $http, $window) {
					var dataList = {};
					var sessionStorage = $window.sessionStorage;
					$scope.isEmpty = true;					

					var contains = function (str, searchString) {
						return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
					};

					var startsWith = function (str, searchString) {
						return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
					};		

					var filter = function (){
						$scope.isEmpty = true;
						$scope.productos = dataList.filter(function (obj) {
							if(contains(obj.nombre, $scope.keyword) || contains(obj.compuesto, $scope.keyword) 
								|| contains(obj.presentacion, $scope.keyword) || contains(obj.registro_sanitario, $scope.keyword)) {
								return obj;
							}
						});

						if($scope.productos.length > 0){
							$scope.isEmpty = false;
						}
					}			
								

					$http.get('http://localhost:8000/productos/')
						.success(function (data) {
							dataList = data;
							$scope.productos = data;
							if(data.length>0){
								$scope.isEmpty = false;
							}
						});					


					$scope.filtrarProductos = function (event) {						
						if(!event){
							filter();							
						}else if(event.keyCode === 13){
							filter();
						}						
					};

					$scope.seleccionarProducto = function (producto) {
						$scope.productoSeleccionado = producto;
					}

					$scope.guardarProducto = function () {
						sessionStorage.setItem("producto", JSON.stringify($scope.productoSeleccionado));
						$scope.productoSeleccionado = {};
						$scope.keyword = '';
					}
				}]
			};
		});	
})();
