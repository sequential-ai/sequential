# sequential_ai.DefaultApi

All URIs are relative to *http://localhost:3000/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**tasks_id_get**](DefaultApi.md#tasks_id_get) | **GET** /tasks/{id} | Get task status and results
[**tasks_post**](DefaultApi.md#tasks_post) | **POST** /tasks | Create a new research task


# **tasks_id_get**
> TaskV2 tasks_id_get(id)

Get task status and results

### Example


```python
import sequential_ai
from sequential_ai.models.task_v2 import TaskV2
from sequential_ai.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost:3000/api
# See configuration.py for a list of all supported configuration parameters.
configuration = sequential_ai.Configuration(
    host = "http://localhost:3000/api"
)


# Enter a context with an instance of the API client
with sequential_ai.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = sequential_ai.DefaultApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get task status and results
        api_response = api_instance.tasks_id_get(id)
        print("The response of DefaultApi->tasks_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->tasks_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**TaskV2**](TaskV2.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Task status |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **tasks_post**
> TaskV2 tasks_post(tasks_post_request)

Create a new research task

### Example


```python
import sequential_ai
from sequential_ai.models.task_v2 import TaskV2
from sequential_ai.models.tasks_post_request import TasksPostRequest
from sequential_ai.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost:3000/api
# See configuration.py for a list of all supported configuration parameters.
configuration = sequential_ai.Configuration(
    host = "http://localhost:3000/api"
)


# Enter a context with an instance of the API client
with sequential_ai.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = sequential_ai.DefaultApi(api_client)
    tasks_post_request = sequential_ai.TasksPostRequest() # TasksPostRequest | 

    try:
        # Create a new research task
        api_response = api_instance.tasks_post(tasks_post_request)
        print("The response of DefaultApi->tasks_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->tasks_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tasks_post_request** | [**TasksPostRequest**](TasksPostRequest.md)|  | 

### Return type

[**TaskV2**](TaskV2.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Task created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

