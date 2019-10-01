#! /bin/bash

export Shib_Identity_Provider=https://samltest.id/saml/idp
export displayName="Rick Sanchez"
export givenName=Rick
export mail=rsanchez@samltest.id
export sn=Sanchez
export uid=rick
export HTTP_COOKIE="preAuthUrl=/roster; many=few;"
export PL_CONFIG=/PrairieLearn/config.json

node shibAuth.js
