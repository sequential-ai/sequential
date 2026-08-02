# TaskV2Input


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**query** | **str** |  | [optional] 
**mode** | **str** |  | [optional] 
**task_spec** | **object** |  | [optional] 

## Example

```python
from sequential_ai.models.task_v2_input import TaskV2Input

# TODO update the JSON string below
json = "{}"
# create an instance of TaskV2Input from a JSON string
task_v2_input_instance = TaskV2Input.from_json(json)
# print the JSON string representation of the object
print(TaskV2Input.to_json())

# convert the object into a dict
task_v2_input_dict = task_v2_input_instance.to_dict()
# create an instance of TaskV2Input from a dict
task_v2_input_from_dict = TaskV2Input.from_dict(task_v2_input_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


