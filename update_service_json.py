import json
import sys

def main():
    try:
        with open('service.json', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading service.json: {e}")
        sys.exit(1)

    # 1. Clean metadata.annotations
    if 'metadata' in data:
        annotations = data['metadata'].get('annotations', {})
        annotations.pop('serving.knative.dev/creator', None)
        annotations.pop('serving.knative.dev/lastModifier', None)

    # 2. Modify spec.template
    if 'spec' in data and 'template' in data['spec']:
        template = data['spec']['template']
        
        # Clean template annotations
        if 'metadata' in template:
            t_annotations = template['metadata'].get('annotations', {})
            t_annotations.pop('run.googleapis.com/sources', None)
            t_annotations.pop('run.googleapis.com/container-dependencies', None)
            t_annotations.pop('run.googleapis.com/base-images', None)
            t_annotations.pop('generativelanguage.googleapis.com/nonce', None)
            
            # Update commit sha label
            t_labels = template['metadata'].get('labels', {})
            t_labels['commit-sha'] = 'a7d95e454daee978ac54752f82d52e90516eb4fe'

        # Modify containers block
        if 'spec' in template:
            t_spec = template['spec']
            t_spec.pop('runtimeClassName', None)
            containers = t_spec.get('containers', [])
            
            # Find app-container
            app_container = None
            for container in containers:
                if container.get('name') == 'app-container':
                    app_container = container
                    break
            
            if not app_container:
                print("Error: Could not find app-container in service.json spec!")
                sys.exit(1)
            
            # Update image to the latest built image tag
            app_container['image'] = 'us-west1-docker.pkg.dev/gen-lang-client-0266123161/cloud-run-source-deploy/caseedge/caseedge:a7d95e454daee978ac54752f82d52e90516eb4fe'
            
            # Remove PORT env variable as it is reserved and automatically set by Cloud Run
            if 'env' in app_container:
                app_container['env'] = [e for e in app_container['env'] if e.get('name') != 'PORT']

            # Configure ports: single container must expose the backend port
            app_container['ports'] = [
                {
                    "containerPort": 3000,
                    "name": "http1"
                }
            ]
            
            # Configure startup probe for port 3000
            app_container['startupProbe'] = {
                "failureThreshold": 10,
                "periodSeconds": 1,
                "tcpSocket": {
                    "port": 3000
                },
                "timeoutSeconds": 1
            }
            
            # Set the containers array to contain ONLY app-container
            t_spec['containers'] = [app_container]

    # 3. Remove status block entirely
    data.pop('status', None)

    # 4. Save updated json
    try:
        with open('service_updated.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("Success: Generated service_updated.json with single container config.")
    except Exception as e:
        print(f"Error writing service_updated.json: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
