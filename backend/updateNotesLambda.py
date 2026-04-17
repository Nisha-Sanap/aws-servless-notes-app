import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    body = json.loads(event['body'])

    user_id = body['userId']
    note_id = body['noteId']
    title = body['title']
    content = body.get('content', '')
    category = body.get('category', 'General')
    note_type = body.get('noteType', 'text')
    pdf_url = body.get('pdfUrl', '')
    file_name = body.get('fileName', '')
    is_shared = body.get('isShared', False)
    updated_at = datetime.utcnow().isoformat()

    table.update_item(
        Key={
            'userId': user_id,
            'noteId': note_id
        },
        UpdateExpression="""
            SET title=:t,
                content=:c,
                category=:cat,
                noteType=:nt,
                pdfUrl=:pu,
                fileName=:fn,
                isShared=:isr,
                updatedAt=:u
        """,
        ExpressionAttributeValues={
            ':t': title,
            ':c': content,
            ':cat': category,
            ':nt': note_type,
            ':pu': pdf_url,
            ':fn': file_name,
            ':isr': is_shared,
            ':u': updated_at
        }
    )

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Note updated successfully'})
    }