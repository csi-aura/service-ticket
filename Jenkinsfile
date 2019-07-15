pipeline {
  agent {
    label "jenkins-nodejs"
  }
  environment {
    ORG = 'csi-aura'
    APP_NAME = 'service-ticket'
    CHARTMUSEUM_CREDS = credentials('jenkins-x-chartmuseum')
    DOCKER_REGISTRY_ORG = 'csi-aura'
    KUBE_ENVIRONMENT = "dev"
  }
  stages {
    stage('CI Build and push snapshot') {
      when {
        branch 'PR-*'
      }
      environment {
        PREVIEW_VERSION = "0.0.0-SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER"
        PREVIEW_NAMESPACE = "$APP_NAME-$BRANCH_NAME".toLowerCase()
        HELM_RELEASE = "$PREVIEW_NAMESPACE".toLowerCase()
      }
      steps {
        container('nodejs') {
          sh "npm install"
          sh "CI=true DISPLAY=:99 npm test"
          sh "export VERSION=$PREVIEW_VERSION && skaffold build -f skaffold.yaml"
          sh "jx step post build --image $DOCKER_REGISTRY/$ORG/$APP_NAME:$PREVIEW_VERSION"
          dir('./charts/preview') {
            sh "make preview"
            sh "jx preview --app $APP_NAME --dir ../.."
          }
        }
      }
    }

    stage('1 - Build') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {

          // ensure we're not on a detached head
          sh "git checkout master"
          sh "git config --global credential.helper store"
          sh "jx step git credentials"

          // so we can retrieve the version in later steps
          sh "echo \$(jx-release-version) > VERSION"
          sh "jx step tag --version \$(cat VERSION)"
        
          sh "npm install && npm run build && npm prune --production"
        }


      }
    }

    stage('2 - Units tests') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          // sh "CI=true DISPLAY=:99 npm run unit_test"
          
        }
      }
    }

    stage('3 - Build docker image') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          sh "export VERSION=`cat VERSION` && skaffold build -f skaffold.yaml"
        }
      }
    }

    stage('4 - Vulnerability test') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          sh "jx step post build --image $DOCKER_REGISTRY/$ORG/$APP_NAME:\$(cat VERSION)"
        }
      }
    }



    stage('5 - Go to staging environment') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          dir('./charts/service-ticket') {
            sh "jx step changelog --batch-mode --version v\$(cat ../../VERSION)"

            // release the helm chart
            sh "jx step helm release"

            // promote through all 'Auto' promotion Environments
            sh "jx promote -b --all-auto --timeout 1h --version \$(cat ../../VERSION)"
          }
        }
      }
    }


    stage('6 - Integration tests') {
      when {
        branch 'master'
      }

      environment  {
          KUBE_ENVIRONMENT = "jx-staging"
      }


      steps {
        container('nodejs') {
          sh "CI=true DISPLAY=:99 npm run integration_test"
        }
      }
    }


  }
  post {
        always {
          cleanWs()
        }
  }
}
