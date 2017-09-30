var Validate = function(table){
	this.table = table;
};

//validate
Validate.prototype.initializeColumn = function(column){
	var self = this,
	config = [],
	validator;

	if(column.definition.validator){

		if(Array.isArray(column.definition.validator)){
			column.definition.validator.forEach(function(item){
				validator = self._extractValidator(item);

				if(validator){
					config.push(validator);
				}
			})

		}else{
			validator = this._extractValidator(column.definition.validator);

			if(validator){
				config.push(validator);
			}
		}

		column.extensions.validate = config.length ? config : false;
	}
};

Validate.prototype._extractValidator = function(value){

	switch(typeof value){
		case "string":
		let parts = value.split(":");
		let type = parts.shift();
		let params = parts.join();

		return this._buildValidator(type, params);
		break;

		case "function":
		return this._buildValidator(value);
		break;

		case "object":
		return this._buildValidator(value.type, value.parameters);
		break;
	}
};

Validate.prototype._buildValidator = function(type, params){

	var func = typeof type == "function" ? type : this.validators[type];

	if(!func){
		console.warn("Validator Setup Error - No matching validator found:", type);
		return false;
	}else{
		return {
			type:typeof type == "function" ? "function" : type,
			func:func,
			params:params,
		};
	}
};


Validate.prototype.validate = function(validators, cell, value){
	var self = this,
	valid = [];

	if(validators){
		validators.forEach(function(item){
			if(!item.func.call(self, cell, value, item.params)){
				valid.push({
					type:item.type,
					parameters:item.params
				});
			}
		});
	}

	return valid.length ? valid : true;
};


Validate.prototype.validators = {

	//is integer
	integer:function(cell, value, parameters){
		value = Number(value);
		return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
	},

	//is float
	float:function(cell, value, parameters){
		value = Number(value);
		return typeof value === 'number' && isFinite(value) && value % 1 !== 0;;
	},

	//must be a number
	numeric:function(cell, value, parameters){
		return !isNaN(value);
	},

	//must be a string
	string:function(cell, value, parameters){
		return isNaN(value);
	},


	//maximum value
	max:function(cell, value, parameters){
		return parseFloat(value) <= parameters;
	},

	//minimum value
	min:function(cell, value, parameters){
		return parseFloat(value) >= parameters;
	},

	//minimum string length
	minLength:function(cell, value, parameters){
		return String(value).length >= parameters;
	},

	//maximum string length
	maxLength:function(cell, value, parameters){
		return String(value).length <= parameters;
	},

	//in provided value list
	in:function(cell, value, parameters){
		if(typeof parameters == "string"){
			parameters = parameters.split("|");
		}

		return parameters.indexOf(value) > -1;
	},

	//must match provided regex
	regex:function(cell, value, parameters){
		var reg = new RegExp(parameters);

		return reg.test(value);
	},

	//value must be unique in this column
	unique:function(cell, value, parameters){
		var unique = true;

		var cellData = cell.getData();

		this.table.rowManager.rows.forEach(function(row){
			var data = row.getData();

			if(data !== cellData){
				if(value == data[cell.getField()]){
					unique = false;
				}
			}
		});

		return unique;
	},

	//must have a value
	required:function(cell, value, parameters){
		return value !== "" & value !== null && typeof value != "undefined";
	},
};


Tabulator.registerExtension("validate", Validate);