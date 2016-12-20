({	
//things that only happen when we first load
	doInit : function(component, event, helper) {		
		console.log("starting init");
		
		var action = component.get("c.queryJSON");

		
		var desc = component.get("c.describe");
	  	desc.setParams({
	  		"objtype" : component.get("v.objectName")
	  	});
	  	desc.setStorable();
	  	desc.setCallback(this, function(a){
	  		var state = a.getState();
	  		if (state === "SUCCESS") {
	  			console.log(JSON.parse(a.getReturnValue()));
	  			component.set("v.objectDescribe", JSON.parse(a.getReturnValue()));

	  			//can't build query until after the describe comes back.
	  			action.setParams({
					"soql" : helper.buildQuery(component)
				});

	  			$A.enqueueAction(action);
	  		}  else if (state === "ERROR") {                    
	  			console.log(a.getError());
	  			var appEvent = $A.get("e.c:handleCallbackError");
	  			appEvent.setParams({
	  				"errors" : a.getError()
	  			});
	  			appEvent.fire();
	  		}
	  	});
	  	$A.enqueueAction(desc);

		//build periodArray
		component.set("v.periodObjects", helper.makePeriodArray(component));


				
		action.setCallback(this, function(a){
			var state = a.getState();
			if (state === "SUCCESS") {
				//console.log(a);
				//component.set("v.data", a.getReturnValue());

				var data = helper.removeParents(component, JSON.parse(a.getReturnValue()));
				helper.buildFilters(component, data);
				helper.buildLegend(component, data);

				component.set("v.originalData", JSON.stringify(data));

				//method that can be reused to orchestra other helper processes.  Good for refiltering
				helper.runAll(component);

				
			}  else if (state === "ERROR") {                    
				console.log(a.getError());
				var appEvent = $A.get("e.c:handleCallbackError");
				appEvent.setParams({
					"errors" : a.getError()
				});
				appEvent.fire();
			}
		});
		
	},

	filterChange : function (component, event, helper){
		console.log("filter changed");
		console.log(event.getSource().getLocalId());
		console.log(event.getSource().get("v.value"));
		var fieldName = event.getSource().getLocalId().replace("filter", "");
		console.log(fieldName);

		var filterValues = component.get("v.filterValues");
		filterValues[fieldName] = event.getSource().get("v.value");
		component.set("v.filterValues", filterValues);

		helper.runAll(component);

	},

	navToRecord : function (component, event){
		var target = event.target.getAttribute("id");
        console.log(event.target);
        console.log(target);
        
        var navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            "recordId" :  target           
        })
        navEvt.fire();   
	}

})