# TasksPostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**query** | **str** | The research query | 
**mode** | **str** |  | [optional] [default to 'FAST']
**task_spec** | **object** | JSON Schema Draft-07 to validate the extracted output. | [optional] 

## Example

```python
from sequential_ai.models.tasks_post_request import TasksPostRequest

# TODO update the JSON string below
json = "{}"
# create an instance of TasksPostRequest from a JSON string
tasks_post_request_instance = TasksPostRequest.from_json(json)
# print the JSON string representation of the object
print(TasksPostRequest.to_json())

# convert the object into a dict
tasks_post_request_dict = tasks_post_request_instance.to_dict()
# create an instance of TasksPostRequest from a dict
tasks_post_request_from_dict = TasksPostRequest.from_dict(tasks_post_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


