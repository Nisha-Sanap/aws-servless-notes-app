import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UsersTable')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])

        userId = body.get('userId')
        password = body.get('password')

        response = table.get_item(Key={'userId': userId})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'User not found'})
            }

        user = response['Item']

        if user['password'] != password:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid password'})
            }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Login successful',
                'userId': user['userId'],
                'name': user['name']
            })
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