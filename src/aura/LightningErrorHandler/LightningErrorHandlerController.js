({
	makeToast : function(component, event, helper) {

		//should we skip this event?
		if (event.getParam("errorComponentName") && (component.get("v.errorHandlerName") !== event.getParam("errorComponentName"))){ 
			return; 
		}
		
		var errors = event.getParam("errors");

		if (errors) {
			errors.forEach( function (error){

				//top-level error.  there can be only one
				if (error.message){
					helper.toastThis(error.message);					
				}

				//page-level errors (validation rules, etc)
				if (error.pageErrors){
					error.pageErrors.forEach( function(pageError) {
						helper.toastThis(pageError.message)						
					});					
				}

				if (error.fieldErrors){
					//field specific errors--we'll say what the field is					
					for (var fieldName in error.fieldErrors) {
						//each field could have multiple errors
						error.fieldErrors[fieldName].forEach( function (errorList){	
							helper.toastThis(errorList.message, "Field Error on " + fieldName + " : ")							
						});                                
					};  //end of field errors forLoop					
				} //end of fieldErrors if
			}); //end Errors forEach
		}
	}
})