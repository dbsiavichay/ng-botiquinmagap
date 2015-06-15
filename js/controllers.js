(function() {	
	angular.module('botiquin.controllers', [])

		.controller('AsociacionController',['$scope', '$http',function ($scope, $http){
			$http.get('http://localhost:8000/asociaciones/?tecnico=2')
				.success(function (data) {
					$scope.asociaciones = data;
					$scope.asociaciones.every(function(element, index, array){
						element.tecnico = JSON.parse(element.tecnico);
						element.ubicacion = JSON.parse(element.ubicacion);
						element.map = new Image();
						element.map.src = 'http://maps.googleapis.com/maps/api/staticmap?center='
							+element.latitud+','+element.longitud+'&zoom=17&size=300x200&maptype=hybrid&'
							+'&markers=size:mid|color:blue|label:A|'+element.latitud+','+element.longitud
							+'&sensor=false';
					});
				});
		}])
		.controller('VentasController', ['$scope', '$http', '$q', 'ventaService', function ($scope, $http, $q, ventaService) {						
			var petsCliente, petsAsociacion;
			ventaService.getTodos()
				.then(function (data) {
					$scope.ventas = data;
					petsCliente = $scope.ventas.map(function (venta) {
						venta.idCliente = venta.cliente;
						return $http.get('http://192.168.1.30:8000/clientes/'+venta.idCliente);
					});

					petsAsociacion = $scope.ventas.map(function (venta) {
						venta.idAsociacion = venta.asociacion;
						return $http.get('http://192.168.1.30:8000/asociaciones/'+venta.idAsociacion);
					});

					$q.all(petsCliente).then(function (clientes) {
						for(var i=0; i<$scope.ventas.length;i++){
							var venta = $scope.ventas[i];
							for(var j=0; i<clientes.length;j++){
								var cliente = clientes[j];								
								if(venta.idCliente === cliente.data.id){
									venta.cliente = cliente.data;
									break;
								}
							}
						}
					});

					$q.all(petsAsociacion).then(function (asociaciones) {
						for(var i=0; i<$scope.ventas.length;i++){
							var venta = $scope.ventas[i];
							for(var j=0; i<asociaciones.length;j++){
								var asociacion = asociaciones[j];								
								if(venta.idAsociacion === asociacion.data.id){
									venta.asociacion = asociacion.data;
									break;
								}
							}
						}
					});
				});

			
		}])
		.controller('VentaController', ['$scope', '$modal', '$routeParams','ventaService', 'asociacionService', function ($scope, $modal, $routeParams, ventaService, asociacionService) {
			var idVenta = parseInt($routeParams.id);							

			//Declaracion de variables
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.asociaciones = [];
			$scope.venta = {};				
			$scope.detalles = [];

			//Acciones constructoras
			if(!isNaN(idVenta)){
				ventaService.getPorId(idVenta)
					.then(function (data) {
						var fecha = data.venta.fecha;
						data.venta.fecha = new Date(fecha);
						data.venta.fecha.setDate(fecha.split('-')[2]);
						$scope.venta = data.venta;						
						$scope.detalles = data.detalles;						
						$scope.detalles.forEach(function (detalle) {
							detalle.valorUnitario = detalle.precio_unitario;
							detalle.valorTotal = detalle.precio_total;
						});

						
					});
			}

			asociacionService.getPorTecnico(2)
				.then(function (data) {
					$scope.asociaciones = data;					
				});
			
			//Funciones
			$scope.buscarCliente = function () {			
				$modal.open({					
					templateUrl: 'partials/cliente-dialog.html',
					controller: 'ClienteController',
				}).result.then(function (data) {
					$scope.venta.cliente = data;
				});				
			}

			$scope.buscarProducto = function ($index) {
				$modal.open({
					templateUrl: 'partials/producto-dialog.html',
					controller: 'ProductoController',
					size: 'lg'
				}).result.then(function (data) {
					$scope.error = false;

					for(var i in $scope.detalles){
						if($scope.detalles[i].producto.id === data.id){
							$scope.error = true;
							$scope.mensajeError = 'El producto seleccionado ya se encuentra en la lista';	
							return;
						}
					}					

					$scope.detalles[$index].producto = data;
					$scope.detalles[$index].valorUnitario = data.precio_referencial;
					$scope.calcularTotal($index);
				});
			}		
			
			$scope.agregarDetalle = function () {
				$scope.error = false;

				var detalle = {
					cantidad: '1',
					producto: '',
					valorUnitario: '0',
					valorTotal: '',
					usos: [],
					esActual: true
				};

				if($scope.detalles.length > 0){
					var prod = $scope.detalles[0].producto;
					var valt = $scope.detalles[0].valorTotal;
					var emptyUsos = $scope.detalles[0].usos.length <= 0? true:false;
					if(!prod || !valt){
						$scope.error = true;
						$scope.mensajeError = 'Debe llenar todos los campos necesarios';
						return;
					}

					if(emptyUsos){
						$scope.error = true;
						$scope.mensajeError = 'Debe especificar los usos del producto';
						return;	
					}

				}

				$scope.detalles.forEach(function (element) {
					element.esActual = false;
				});

				$scope.detalles.unshift(detalle);
			}

			$scope.editarDetalle = function ($index) {				
				$scope.error = false;

				for(var i=0; i < $scope.detalles.length; i++){
					$scope.detalles[i].esActual = false;
					if((!$scope.detalles[i].producto || !$scope.detalles[i].valorTotal) && $index != i){
						$scope.detalles.splice(i,1);
						if(i < $index) $index = $index -1;
						i = i-1;
					}
				}
							
				$scope.detalles[$index].esActual = true;
			}

			$scope.eliminarDetalle = function ($index) {	
				$scope.error = false;
				$scope.detalles.splice($index, 1);				
			}		

			$scope.calcularTotal = function ($index) {											
				var p = $scope.detalles[$index].valorUnitario;
				var c = $scope.detalles[$index].cantidad;
				$scope.detalles[$index].valorTotal = p * c;
				if(isNaN($scope.detalles[$index].valorTotal)){
					$scope.detalles[$index].valorTotal = "0.00";
				}	
			}

			$scope.buscarUsos = function ($index) {
				$modal.open({
					templateUrl: 'partials/uso-dialog.html',
					controller: 'UsoController',
					resolve: {
						data: function () {
							return $scope.detalles[$index];
						}
					}					
				}).result.then(function (data) {					
					$scope.detalles[$index].usos = data;					
				});
			}

			$scope.seleccionarFecha = function ($event) {
				console.log($scope.venta.fecha.getTime());
				$event.preventDefault;
				$event.stopPropagation();
				$scope.venta.fechaPopup = true;				
			}			

			$scope.guardarVenta = function () {
				$scope.error = false;
				if(!$scope.venta.asociacion) $scope.error = true;
				if(!$scope.venta.cliente) $scope.error = true;
				if(!$scope.venta.fecha) $scope.error = true;

				if($scope.error){
					$scope.mensajeError = 'Debe llenar todos los campos de encabezado.';
					return;
				}

				if($scope.detalles.length < 1){
					$scope.error = true;	
					$scope.mensajeError = 'No ha ingresado detalles de venta.';
					return;
				} 

				for (var i in $scope.detalles) {
					var detalle = $scope.detalles[i];
					if(!detalle.producto || !detalle.valorTotal){
						$scope.error = true;
						$scope.mensajeError = 'La lista de detalles tiene items con campos obligatorios faltantes';
						return;
					}
				}

				for (var i in $scope.detalles) {
					var detalle = $scope.detalles[i];
					if(detalle.usos.length < 1){
						$scope.error = true;
						$scope.mensajeError = 'El item ' + detalle.producto.nombre + ' no tiene USOS resgistrados';
						return;
					}
				}

				var total = 0;
				for(var i in $scope.detalles){
					var detalle = $scope.detalles[i];
					total+=detalle.valorTotal;
				}

				$scope.venta.valor_total = total;				

				ventaService.guardar({
					venta: $scope.venta,
					detalles: $scope.detalles,
				});
			}				
		}])
		.controller('ClienteController', ['$scope', '$modalInstance', 'clienteService', function ($scope, $modalInstance, clienteService) {
			var dataList = {};
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.empty = true;	

			clienteService.getTodos()
				.then(function (data) {
					dataList = data;
					$scope.clientes = data;					
					if(data.length>0){
						$scope.empty = false;
					}
				});

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.empty = true;				
				$scope.clientes = dataList.filter(function (obj) {
					if(startsWith(obj.cedula, $scope.keyword) || contains(obj.nombre, $scope.keyword) || contains(obj.apellido, $scope.keyword)) {
						return obj;
					}
				});

				if($scope.clientes.length > 0){
					$scope.empty = false;
				}
			}			
						
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

			$scope.ok = function () {
				if(!$scope.clienteSeleccionado){
					$scope.error = true;
					$scope.mensajeError = 'No ha seleccionado ningun item.';
					return;
				}
				$modalInstance.close($scope.clienteSeleccionado);
			}	

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}		
		}])
		.controller('ProductoController', ['$scope', '$modalInstance', 'productoService', function ($scope, $modalInstance, productoService) {
			var dataList = {};
			$scope.productos = [];					
			$scope.error = false;
			$scope.mensajeError = '';
			$scope.empty = true;

			var contains = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) > -1;
			};

			var startsWith = function (str, searchString) {
				return str.toLowerCase().indexOf(searchString.toLowerCase()) === 0;
			};		

			var filter = function (){
				$scope.empty = true;
				$scope.productos = dataList.filter(function (obj) {
					if(contains(obj.nombre, $scope.keyword) || contains(obj.compuesto, $scope.keyword) 
						|| contains(obj.presentacion, $scope.keyword) || contains(obj.registro_sanitario, $scope.keyword)) {
						return obj;
					}
				});

				if($scope.productos.length > 0){
					$scope.empty = false;
				}
			}			
						

			productoService.getTodos()
				.then(function (data) {
					dataList = data;
					$scope.productos = data;
					if(data.length>0){
						$scope.empty = false;
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

			$scope.ok = function () {				
				if(!$scope.productoSeleccionado){
					$scope.error = true;
					$scope.mensajeError = 'No ha seleccionado ningun item.';
					return;
				}
				$modalInstance.close($scope.productoSeleccionado);
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}	
		}])
		.controller('UsoController', ['$scope', '$modalInstance', 'enfermedadService', 'especieService', 'data', function ($scope, $modalInstance, enfermedadService, especieService, data) {
			$scope.detalle = data;
			$scope.uso = {
				cantidad: $scope.detalle.cantidad,
				enfermedad: '',
				especie: ''
			};
			$scope.usos = data.usos;
			$scope.enfermedades = [];
			$scope.especies = [];	
			$scope.error = false;
			$scope.mensajeError = '';

			enfermedadService.getTodos()
				.then(function (data) {
					$scope.enfermedades = data;
				});

			especieService.getTodos()
				.then(function (data) {
					$scope.especies = data;
				});

			$scope.usos.forEach(function (element) {
				element.esActual = false;
			})

			$scope.agregarUso = function () {				
				$scope.error = false;	

				$scope.usos.forEach(function (uso) {
					uso.esActual = false;					
				});				

				for(propiedad in $scope.uso){						
					if($scope.uso[propiedad]){
						$('#'+ propiedad +'Usos').removeClass('has-error');						
					}else{
						$('#'+ propiedad +'Usos').addClass('has-error');	
						$scope.error = true;										
					}
				}					
				
				if($scope.error){
					$scope.mensajeError = 'Todos lo campos son necesarios.';
					return;
				} 				

				for (var i in $scope.usos) {
					var uso = $scope.usos[i];						
					if(uso.enfermedad.nombre===$scope.uso.enfermedad.nombre
						&& uso.especie.nombre===$scope.uso.especie.nombre){
						$scope.error = true;
						$scope.mensajeError = 'Los datos seleccionados ya se encuentran en la lista.';
						return;
					}
				}

				
				$scope.usos.push($scope.uso);				
				$scope.uso = {
					cantidad: '',
					enfermedad: '',
					especie: ''
				};
			}

			$scope.editarUso = function ($index) {
				$scope.usos.forEach(function (uso) {
					uso.esActual = false;
				});

				$scope.usos[$index].esActual = true;
			}

			$scope.eliminarUso = function ($index) {
				$scope.usos.forEach(function (uso) {
					uso.esActual = false;					
				});	
				$scope.usos.splice($index, 1);
			}

			$scope.ok = function () {				
				if($scope.usos.length <= 0){
					$scope.error = true;
					$scope.mensajeError = 'No ha ingresado items.';
					return;
				}
				$modalInstance.close($scope.usos);
			}

			$scope.cancelar = function () {			
				$modalInstance.dismiss('cancel');
			}
		}]);
})();