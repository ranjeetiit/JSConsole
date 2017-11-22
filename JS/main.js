!function (window) {
	function View(){
		this.outputContainer = document.getElementById("output");
		this.inputBox =  document.getElementById("input");
		this.outputTmpl = 	'<div>'+ 
								'<span">&lt;&nbsp;</span>'+
								'<span class="command">{cmdName}</span>'+
							'<div>'+
							'<span class="prefix">&gt;&nbsp;</span>'+
							'<span class={resultType}>{result}</span>';
	}

	View.prototype.updateOutput = function(item){
		var html = "";
		var fragemnt = document.createDocumentFragment();
		var div = document.createElement('div');

		html  = this.outputTmpl.replace("{cmdName}" ,item.command).
								replace("{resultType}" ,item._class).
								replace("{result}" ,item.result);
		div.innerHTML = html;
		fragemnt.appendChild(div)
		this.outputContainer.appendChild(fragemnt);
		this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
	}

	function Model(){
		this.cmdHistory = window.localStorage && window.localStorage.getItem("cmdHistory") ?
							JSON.parse(window.localStorage.getItem("cmdHistory")) : [];
	}

	Model.prototype.addToHistory = function(item){
		this.cmdHistory.push(item);
		this.addToLocalStorage();
	}

	Model.prototype.addToLocalStorage = function(){ 
		if(window.localStorage){
			window.localStorage.setItem("cmdHistory" , JSON.stringify(this.cmdHistory));
		}
	}

	function Controller(view ,model){
		this.view = view;
		this.model = model;
		this.currentHistory = "";
		this.historyState = this.model.cmdHistory.length;
	}

	Controller.prototype.setView = function(){
		var inputBox = this.view.inputBox;
			inputBox.focus();
		inputBox.addEventListener("keyup" , this.inputKeyup.bind(this));
		inputBox.addEventListener("keydown" , this.inputKeydown.bind(this));
	}

	Controller.prototype.inputKeyup = function(e){
	
	} 


	Controller.prototype.inputKeydown = function(e){
		if (e.which === 13) {
			var val = e.target.value;
			e.preventDefault();
			// Need to HAndle Shift + Enter
			if ( e.shiftKey ) {
				this.currentHistory = val + "\n";
				this.updtateInputVal(this.currentHistory);
			}else{
				this.evaluate( val );
				this.updtateInputVal("");
				this.currentHistory = "";
			}
			return false;
		}


		// Up / down keys cycle through past history or move up/down
		if ( !e.shiftKey && (e.which === 38 || e.which === 40) ) {
			var history = this.model.cmdHistory;
			
			// `direction` is -1 or +1 to go forward/backward through command history
			var direction = e.which - 39;
			this.historyState +=  direction;

			// Keep it within bounds
			if (this.historyState < 0){
				this.historyState = 0;
			} else if (this.historyState >= history.length){
				this.historyState = history.length;
			} 
			
			// Update the currentHistory value and update the View
			this.currentHistory = history[this.historyState] ? history[this.historyState].command : "";
			this.updtateInputVal(this.currentHistory);
			return false;
		}

		//Disabling tab key for now
		if ( e.which === 9 ) {
			return false;
		}

	} 

	Controller.prototype.updtateInputVal =function(val){
		this.view.inputBox.value = val;
	} 

	Controller.prototype.evaluate = function(cmd){
		if ( !cmd )
			return false;

		var item = {
			command : cmd
		};

		try {
			item.result = eval.call(window, cmd);
			if ( _.isUndefined(item.result) ){
				item._class = "undefined";	
			} else if ( _.isNumber(item.result) ){
				item._class = "number";
			}else if ( _.isString(item.result) ){
				item._class = "string";	
			} 
		} catch(error) {
			item.result = error.toString();
			item._class = "error";
		}
		this.addHistory(item);
		this.view.updateOutput(item);
	}

	Controller.prototype.addHistory = function(item){
		if (_.isString(item.result)) {
			item.result = '\"' + item.result.toString().replace(/"/g, '\\"') + '\"';
		}else if (_.isFunction(item.result)){
			item.result = item.result.toString().replace(/"/g, '\\"');	
		}else if (_.isObject(item.result)) {
			item.result = JSON.stringify(item.result);
		}else if (_.isUndefined(item.result)) {
			item.result = "undefined";
		}

		this.model.addToHistory(item);
		this.historyState = this.model.cmdHistory.length;
	}

	var view = new View();
	var model = new Model();
	var controller = new Controller(view, model);
	controller.setView();
}(window)