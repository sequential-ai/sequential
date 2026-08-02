# TaskV2Execution


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**worker_runs** | **List[object]** |  | [optional] 
**metrics** | **object** |  | [optional] 

## Example

```python
from sequential_ai.models.task_v2_execution import TaskV2Execution

# TODO update the JSON string below
json = "{}"
# create an instance of TaskV2Execution from a JSON string
task_v2_execution_instance = TaskV2Execution.from_json(json)
# print the JSON string representation of the object
print(TaskV2Execution.to_json())

# convert the object into a dict
task_v2_execution_dict = task_v2_execution_instance.to_dict()
# create an instance of TaskV2Execution from a dict
task_v2_execution_from_dict = TaskV2Execution.from_dict(task_v2_execution_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


