# TaskV2Output


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**answer** | **str** |  | [optional] 
**data** | **object** |  | [optional] 

## Example

```python
from sequential_ai.models.task_v2_output import TaskV2Output

# TODO update the JSON string below
json = "{}"
# create an instance of TaskV2Output from a JSON string
task_v2_output_instance = TaskV2Output.from_json(json)
# print the JSON string representation of the object
print(TaskV2Output.to_json())

# convert the object into a dict
task_v2_output_dict = task_v2_output_instance.to_dict()
# create an instance of TaskV2Output from a dict
task_v2_output_from_dict = TaskV2Output.from_dict(task_v2_output_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


