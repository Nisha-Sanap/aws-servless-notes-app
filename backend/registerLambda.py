import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UsersTable')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])

        userId = body.get('userId')
        name = body.get('name')
        email = body.get('email')
        password = body.get('password')

        # Check if user already exists
        existing = table.get_item(Key={'userId': userId})
        if 'Item' in existing:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'User already exists'})
            }

        table.put_item(Item={
            'userId': userId,
            'name': name,
            'email': email,
            'password': password
        })

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'User registered successfully'})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }