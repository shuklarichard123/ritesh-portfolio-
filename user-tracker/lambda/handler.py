"""
Lambda handler for User Tracker API
Stores user request data into DynamoDB
"""

import json
import os
import uuid
import boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("TABLE_NAME", "user-tracker")


def _response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body),
    }


def create_record(event: dict) -> dict:
    """POST /records — store a new user request"""
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON body"})

    # Validate required fields
    username = body.get("username", "").strip()
    requested_data = body.get("requested_data", "").strip()
    input_parameters = body.get("input_parameters", {})

    if not username:
        return _response(400, {"error": "username is required"})
    if not requested_data:
        return _response(400, {"error": "requested_data is required"})

    request_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    item = {
        "request_id": request_id,
        "username": username,
        "requested_data": requested_data,
        "input_parameters": input_parameters,
        "created_at": timestamp,
    }

    table = dynamodb.Table(TABLE_NAME)
    table.put_item(Item=item)

    return _response(201, {"message": "Record created", "request_id": request_id, "item": item})


def list_records(event: dict) -> dict:
    """GET /records — list all records (optionally filter by username)"""
    table = dynamodb.Table(TABLE_NAME)
    query_params = event.get("queryStringParameters") or {}
    username = query_params.get("username", "").strip()

    if username:
        # Query using GSI on username
        result = table.query(
            IndexName="username-index",
            KeyConditionExpression=Key("username").eq(username),
        )
    else:
        result = table.scan()

    items = result.get("Items", [])
    # Sort newest first
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return _response(200, {"count": len(items), "records": items})


def get_record(event: dict) -> dict:
    """GET /records/{request_id} — fetch a single record"""
    request_id = (event.get("pathParameters") or {}).get("request_id", "")
    if not request_id:
        return _response(400, {"error": "request_id path parameter is required"})

    table = dynamodb.Table(TABLE_NAME)
    result = table.get_item(Key={"request_id": request_id})
    item = result.get("Item")

    if not item:
        return _response(404, {"error": f"Record {request_id} not found"})

    return _response(200, item)


def handler(event: dict, context) -> dict:
    """Main Lambda entry point — routes by HTTP method and path"""
    method = event.get("httpMethod", "GET").upper()
    path = event.get("path", "/")

    # Handle CORS preflight
    if method == "OPTIONS":
        return _response(200, {})

    # Route: POST /records
    if method == "POST" and path == "/records":
        return create_record(event)

    # Route: GET /records/{request_id}
    if method == "GET" and "/records/" in path:
        return get_record(event)

    # Route: GET /records
    if method == "GET" and path == "/records":
        return list_records(event)

    return _response(404, {"error": f"Route {method} {path} not found"})
