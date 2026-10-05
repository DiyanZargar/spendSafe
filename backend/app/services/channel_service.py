import uuid
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.channel_connection import ChannelConnection
from app.schemas.channel import ChannelConnectionCreate, ChannelConnectionUpdate
from app.repositories.channel_repository import ChannelRepository
from app.security.encryption import encrypt_credentials, decrypt_credentials
from app.services.base_service import BaseService


class ChannelService(BaseService[ChannelConnection]):
    """Service handling multi-channel connections and secure encrypted credentials."""

    def __init__(self, session: AsyncSession):
        self.channel_repo = ChannelRepository(session)
        super().__init__(self.channel_repo)

    async def verify_channel_credentials(self, channel_type: str, credentials: Dict[str, Any]) -> bool:
        """Verify credentials against channel provider API without storing."""
        from app.channels.channel_manager import ChannelManager
        mgr = ChannelManager()
        channel = mgr.get_channel(channel_type)
        return await channel.validate_credentials(credentials)

    async def connect_channel(
        self,
        user_id: uuid.UUID,
        data: ChannelConnectionCreate
    ) -> ChannelConnection:
        """Create or update a channel connection with encrypted credentials."""
        if data.verify:
            is_valid = await self.verify_channel_credentials(data.channel_type, data.credentials)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Verification failed for {data.channel_type}. Please check your credentials."
                )

        existing = await self.channel_repo.get_by_external_id(
            channel_type=data.channel_type,
            external_identifier=data.external_identifier
        )
        if existing and existing.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This {data.channel_type} identifier is already linked to another account."
            )

        encrypted_creds = encrypt_credentials(data.credentials)

        if existing:
            existing.credentials_encrypted = encrypted_creds
            existing.settings = data.settings
            existing.is_active = True
            return await self.channel_repo.update(existing)

        new_connection = ChannelConnection(
            id=uuid.uuid4(),
            user_id=user_id,
            channel_type=data.channel_type.lower().strip(),
            external_identifier=data.external_identifier.strip(),
            credentials_encrypted=encrypted_creds,
            is_active=True,
            settings=data.settings,
        )
        return await self.channel_repo.create(new_connection)

    async def get_decrypted_credentials(self, connection_id: uuid.UUID) -> Dict[str, Any]:
        """Fetch and decrypt credentials for channel dispatching."""
        connection = await self.channel_repo.get(connection_id)
        if not connection or not connection.credentials_encrypted:
            return {}
        return decrypt_credentials(connection.credentials_encrypted)

    async def resolve_identity(self, channel_type: str, external_identifier: str) -> Optional[uuid.UUID]:
        """Resolve external sender identity (phone number, telegram ID) to internal user_id."""
        connection = await self.channel_repo.get_by_external_id(
            channel_type=channel_type,
            external_identifier=external_identifier
        )
        if connection and connection.is_active:
            return connection.user_id
        return None

    async def list_connections(self, user_id: uuid.UUID) -> List[ChannelConnection]:
        """List channel connections for a user."""
        return await self.channel_repo.list_by_user(user_id)

    async def delete_connection(self, connection_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Remove a channel connection."""
        conn = await self.channel_repo.get(connection_id)
        if not conn or conn.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel connection not found."
            )
        await self.channel_repo.delete(conn.id)
        return True

    async def update_connection(
        self,
        connection_id: uuid.UUID,
        user_id: uuid.UUID,
        data: ChannelConnectionUpdate
    ) -> ChannelConnection:
        """Update an existing channel connection's identifier or credentials."""
        conn = await self.channel_repo.get(connection_id)
        if not conn or conn.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel connection not found."
            )

        if data.external_identifier is not None and data.external_identifier.strip():
            # Check if another connection has this external identifier
            existing = await self.channel_repo.get_by_external_id(
                channel_type=conn.channel_type,
                external_identifier=data.external_identifier.strip()
            )
            if existing and existing.id != conn.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"This {conn.channel_type} identifier is already linked to another connection."
                )
            conn.external_identifier = data.external_identifier.strip()

        if data.credentials is not None and len(data.credentials) > 0:
            conn.credentials_encrypted = encrypt_credentials(data.credentials)

        if data.is_active is not None:
            conn.is_active = data.is_active

        if data.settings is not None:
            conn.settings = data.settings

        return await self.channel_repo.update(conn)
