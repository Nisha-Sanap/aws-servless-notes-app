import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    body = json.loads(event['body'])

    user_id = body['userId']
    note_id = body['noteId']

    table.delete_item(
        Key={
            'userId': user_id,
            'noteId': note_id
        }
    )

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Note deleted successfully'})
    }