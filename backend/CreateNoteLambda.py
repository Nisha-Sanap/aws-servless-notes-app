import json
import boto3
import uuid
import base64
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

table = dynamodb.Table('NotesTable')
BUCKET_NAME = 'cloud-notes-pdf-vaishnavi-2026'


def lambda_handler(event, context):
    try:
        print("Full Event:", json.dumps(event))

        body = json.loads(event['body'])
        print("Parsed Body:", body)

        userId = body.get('userId', '')
        title = body.get('title', '')
        category = body.get('category', '')
        noteType = body.get('noteType', 'text')
        content = body.get('content', '')
        fileName = body.get('fileName', '')
        pdfFileData = body.get('pdfFileData', '')
        isShared = body.get('isShared', False)

        noteId = str(uuid.uuid4())
        createdAt = datetime.utcnow().isoformat()
        pdfUrl = ""

        # If PDF note, upload to S3
        if noteType == "pdf" and pdfFileData:
            file_bytes = base64.b64decode(pdfFileData)

            s3_key = f"pdf-notes/{noteId}_{fileName}"

            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType='application/pdf'
            )

            pdfUrl = f"https://{BUCKET_NAME}.s3.ap-south-1.amazonaws.com/{s3_key}"

        # Prepare item for DynamoDB
        item = {
            'userId': userId,
            'noteId': noteId,
            'title': title,
            'category': category,
            'noteType': noteType,
            'content': content,
            'fileName': fileName,
            'pdfUrl': pdfUrl,
            'isShared': isShared,
            'createdAt': createdAt
        }

        print("Saving Item to DynamoDB:", item)

        table.put_item(Item=item)

        print("Note saved successfully")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Note created successfully',
                'noteId': noteId,
                'pdfUrl': pdfUrl
            })
        }

    except Exception as e:
        print("Error:", str(e))

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
