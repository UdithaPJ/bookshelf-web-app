import * as cdk from "aws-cdk-lib";
import { Stack, CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import {
  AuthorizationType,
  GraphqlApi,
  MappingTemplate,
  SchemaFile,
} from "aws-cdk-lib/aws-appsync";
import {
  AccountRecovery,
  OAuthScope,
  UserPool,
  UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class BookshelfWebStack extends Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cognito = new UserPool(this, "BookshelfUserPool", {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      standardAttributes: {
        email: {
          required: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolClient = new UserPoolClient(this, "BookshelfClient", {
      userPool: cognito,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: ["http://localhost:3000"],
      },
    });

    const graphqlApi = new GraphqlApi(this, "BooksApi", {
      name: "Books-graphqlApi",
      schema: SchemaFile.fromAsset("graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: cognito,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.API_KEY,
            apiKeyConfig: {
              name: "GraphQLBooksApiKey",
              description: "Books API Key",
              expires: cdk.Expiration.after(cdk.Duration.days(365)),
            },
          },
        ],
      },
      xrayEnabled: true,
    });

    const booksTable = new Table(this, "BooksTable", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
    });

    const bookDs = graphqlApi.addDynamoDbDataSource("BooksTableDs", booksTable);

    graphqlApi.createResolver("GetBook", {
      typeName: "Query",
      fieldName: "getBook",
      dataSource: bookDs,
      requestMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamoGetItem.request.vtl"
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamo.response.vtl"
      ),
    });

    graphqlApi.createResolver("ListBooks", {
      typeName: "Query",
      fieldName: "listBooks",
      dataSource: bookDs,
      requestMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamoListItem.request.vtl"
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamo.response.vtl"
      ),
    });

    graphqlApi.createResolver("CreateBook", {
      typeName: "Mutation",
      fieldName: "createBook",
      dataSource: bookDs,
      requestMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamoCreateItem.request.vtl"
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamo.response.vtl"
      ),
    });

    graphqlApi.createResolver("UpdateBook", {
      typeName: "Mutation",
      fieldName: "updateBook",
      dataSource: bookDs,
      requestMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamoUpdateItem.request.vtl"
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamo.response.vtl"
      ),
    });

    graphqlApi.createResolver("DeleteBook", {
      typeName: "Mutation",
      fieldName: "deleteBook",
      dataSource: bookDs,
      requestMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamoDeleteItem.request.vtl"
      ),
      responseMappingTemplate: MappingTemplate.fromFile(
        "graphql/vtl/dynamo.response.vtl"
      ),
    });

    new CfnOutput(this, "UserPoolId", {
      value: cognito.userPoolId || "",
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId || "",
    });

    new CfnOutput(this, "GraphQLBooksURL", {
      value: graphqlApi.graphqlUrl,
    });
    new CfnOutput(this, "GraphQLBooksApiKey", {
      value: graphqlApi.apiKey || "",
    });
  }
}

// BookshelfWebStack.GraphQLBooksApiKey = da2-bkf3uhlrzbabbipkghkr2mu3ym
// BookshelfWebStack.GraphQLBooksURL = https://2cdbgu3gkfh4ti6kr5dqy64fpy.appsync-api.ap-south-1.amazonaws.com/graphql
// BookshelfWebStack.UserPoolClientId = 1am4aou1jb6d88l80bkp3ggf6l
// BookshelfWebStack.UserPoolId = ap-south-1_CQBAnLxA4

//AdministratorAccess-361769567955
