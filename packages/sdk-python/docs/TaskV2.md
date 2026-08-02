# TaskV2


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**input** | [**TaskV2Input**](TaskV2Input.md) |  | [optional] 
**execution** | [**TaskV2Execution**](TaskV2Execution.md) |  | [optional] 
**output** | [**TaskV2Output**](TaskV2Output.md) |  | [optional] 
**sources** | [**List[TaskV2SourcesInner]**](TaskV2SourcesInner.md) |  | [optional] 

## Example

```python
from sequential_ai.models.task_v2 import TaskV2

# TODO update the JSON string below
json = "{}"
# create an instance of TaskV2 from a JSON string
task_v2_instance = TaskV2.from_json(json)
# print the JSON string representation of the object
print(TaskV2.to_json())

# convert the object into a dict
task_v2_dict = task_v2_instance.to_dict()
# create an instance of TaskV2 from a dict
task_v2_from_dict = TaskV2.from_dict(task_v2_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


