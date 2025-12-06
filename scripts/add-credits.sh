#!/bin/bash
# Add Credits Script
# Usage: ./scripts/add-credits.sh [workspace-id] [amount]
# Or: ./scripts/add-credits.sh --all [amount]
# Or: ./scripts/add-credits.sh --list

set -e

DB_CONTAINER="aikeedo-nextjs-test-db"
DB_USER="aikeedo"
DB_NAME="aikeedo_dev"

# Function to execute SQL
exec_sql() {
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>&1
}

# Function to list workspaces
list_workspaces() {
    echo "📋 Available Workspaces:"
    echo ""
    exec_sql "
        SELECT 
            w.id,
            w.name,
            w.\"creditCount\" as credits,
            u.email as owner_email,
            u.\"firstName\" || ' ' || u.\"lastName\" as owner_name
        FROM workspaces w
        JOIN users u ON w.\"ownerId\" = u.id
        ORDER BY w.\"createdAt\" DESC;
    "
}

# Function to add credits to a specific workspace
add_credits() {
    local workspace_id="$1"
    local amount="$2"
    
    echo "Adding $amount credits to workspace $workspace_id..."
    
    result=$(exec_sql "
        UPDATE workspaces 
        SET \"creditCount\" = \"creditCount\" + $amount 
        WHERE id = '$workspace_id'
        RETURNING name, \"creditCount\";
    ")
    
    if echo "$result" | grep -q "UPDATE 0"; then
        echo "❌ Error: Workspace not found"
        exit 1
    else
        echo "✅ Credits added successfully!"
        echo "$result"
    fi
}

# Function to add credits to all workspaces
add_credits_all() {
    local amount="$1"
    
    echo "Adding $amount credits to all workspaces..."
    
    result=$(exec_sql "
        UPDATE workspaces 
        SET \"creditCount\" = \"creditCount\" + $amount
        RETURNING id;
    ")
    
    count=$(echo "$result" | grep -c "^[[:space:]]*[a-f0-9-]\{36\}" || true)
    echo "✅ Added $amount credits to $count workspaces"
}

# Main script
if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    cat << EOF
Usage:
  ./scripts/add-credits.sh <workspace-id> <amount>
  ./scripts/add-credits.sh --all <amount>
  ./scripts/add-credits.sh --list

Examples:
  ./scripts/add-credits.sh abc-123 1000          # Add 1000 credits to workspace abc-123
  ./scripts/add-credits.sh --all 5000            # Add 5000 credits to all workspaces
  ./scripts/add-credits.sh --list                # List all workspaces

EOF
    exit 0
fi

if [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
    list_workspaces
    exit 0
fi

if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    if [ $# -lt 2 ]; then
        echo "❌ Error: Amount is required"
        echo "Usage: ./scripts/add-credits.sh --all <amount>"
        exit 1
    fi
    
    amount="$2"
    if ! [[ "$amount" =~ ^[0-9]+$ ]] || [ "$amount" -le 0 ]; then
        echo "❌ Error: Amount must be a positive number"
        exit 1
    fi
    
    add_credits_all "$amount"
    exit 0
fi

if [ $# -lt 2 ]; then
    echo "❌ Error: Workspace ID and amount are required"
    echo "Usage: ./scripts/add-credits.sh <workspace-id> <amount>"
    exit 1
fi

workspace_id="$1"
amount="$2"

if ! [[ "$amount" =~ ^[0-9]+$ ]] || [ "$amount" -le 0 ]; then
    echo "❌ Error: Amount must be a positive number"
    exit 1
fi

add_credits "$workspace_id" "$amount"
