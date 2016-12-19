({	
//things that only happen when we first load
	doInit : function(component, event, helper) {		
		
		//build periodArray
		component.set("v.periodObjects", helper.makePeriodArray(component));

		var action = component.get("c.queryJSON");

		action.setParams({
			"soql" : helper.buildQuery(component)
		});
		
		action.setCallback(this, function(a){
			var state = a.getState();
			if (state === "SUCCESS") {
				console.log(a);
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
		$A.enqueueAction(action);
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