#!/usr/bin/env bash
set -euo pipefail

#mkdir -p ~/.ssh /app/keys
#chmod 700 ~/.ssh /app/keys
#printf "%s" "$SSH_TUNNEL_PEM" > /app/keys/heroku_tunnel.key && chmod 600 /app/keys/heroku_tunnel.key
#ssh-keyscan -t ed25519 "$SSH_TUNNEL_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true
#chmod 600 ~/.ssh/known_hosts

#echo "Connectiing to 15432:$SSH_REMOTE_HOST:5432 for $SSH_TUNNEL_USER@$SSH_TUNNEL_HOST"

#autossh -M 0 -f -N \
  #-L 127.0.0.1:15432:"$SSH_REMOTE_HOST":5432 \
  #-p "${SSH_TUNNEL_PORT:-22}" \
  #-i "$SSH_TUNNEL_PEM" \
  #-o UserKnownHostsFile=~/.ssh/known_hosts \
  #-o StrictHostKeyChecking=yes \
  #"$SSH_TUNNEL_USER@$SSH_TUNNEL_HOST"

#for i in {1..20}; do
    #echo "[CHECKING] Connectiing to 15432:$SSH_REMOTE_HOST:5432 for $SSH_TUNNEL_USER@$SSH_TUNNEL_HOST:$SSH_TUNNEL_PORT"
    #nc -z 127.0.0.1 15432 && break; sleep 2;
#done

#nc -z 127.0.0.1 15432 && echo "Port 15432 open" || echo "Port 15432 closed"
#nc -z 127.0.0.1 5432 && echo "Port 5432 open" || echo "Port 5432 closed"

#php artisan migrate --force

#pkill -f autossh || true

echo "Release completed."
