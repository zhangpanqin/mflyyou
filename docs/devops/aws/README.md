## AWS

```shell
aws sts assume-role --role-arn arn:aws:iam::{account id}:role/{roleName}--role-session-name s3-access-example

unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
aws sts get-caller-identity
```






