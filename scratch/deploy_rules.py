import subprocess
import urllib.request
import urllib.error
import json
import sys

project_id = "gen-lang-client-0266123161"
database_id = "ai-studio-c4007c60-6fcb-4c15-85f2-4e79dde9a2fa"
rules_file_path = "firestore.rules"

def get_access_token():
    print("Fetching access token from gcloud...")
    result = subprocess.run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True, check=True)
    return result.stdout.strip()

def make_request(url, method, data, headers):
    req = urllib.request.Request(url, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        try:
            return e.code, json.loads(err_msg)
        except Exception:
            return e.code, {"error": err_msg}
    except Exception as e:
        return 0, {"error": str(e)}

def main():
    try:
        token = get_access_token()
    except Exception as e:
        print(f"Failed to get gcloud access token: {e}")
        sys.exit(1)

    try:
        with open(rules_file_path, "r") as f:
            rules_content = f.read()
    except Exception as e:
        print(f"Failed to read firestore.rules: {e}")
        sys.exit(1)

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Goog-User-Project": project_id
    }

    # 1. Create Ruleset
    print("Creating ruleset...")
    ruleset_payload = {
        "source": {
            "files": [
                {
                    "name": "firestore.rules",
                    "content": rules_content
                }
            ]
        }
    }
    url_rulesets = f"https://firebaserules.googleapis.com/v1/projects/{project_id}/rulesets"
    data = json.dumps(ruleset_payload).encode('utf-8')
    status, res = make_request(url_rulesets, "POST", data, headers)
    if status != 200:
        print(f"Error creating ruleset (Status {status}): {res}")
        sys.exit(1)

    ruleset_name = res.get("name")
    print(f"Ruleset created successfully: {ruleset_name}")

    # 2. Update or Create Release
    release_name = f"projects/{project_id}/releases/cloud.firestore/{database_id}"
    print(f"Updating release: {release_name} ...")
    
    # Try PATCH first
    url_patch = f"https://firebaserules.googleapis.com/v1/{release_name}?updateMask=rulesetName"
    release_payload = {
        "release": {
            "name": release_name,
            "rulesetName": ruleset_name
        }
    }
    data_patch = json.dumps(release_payload).encode('utf-8')
    
    status, res = make_request(url_patch, "PATCH", data_patch, headers)
    
    if status == 200:
        print(f"Success! Release updated successfully: {res.get('name')}")
    elif status == 404:
        # If release does not exist, create it via POST
        print("Release not found. Creating a new release...")
        url_create = f"https://firebaserules.googleapis.com/v1/projects/{project_id}/releases"
        data_create = json.dumps({
            "name": release_name,
            "rulesetName": ruleset_name
        }).encode('utf-8')
        status_create, res_create = make_request(url_create, "POST", data_create, headers)
        if status_create == 200:
            print(f"Success! Release created successfully: {res_create.get('name')}")
        else:
            print(f"Error creating release (Status {status_create}): {res_create}")
            sys.exit(1)
    else:
        print(f"Error updating release (Status {status}): {res}")
        sys.exit(1)

if __name__ == '__main__':
    main()
