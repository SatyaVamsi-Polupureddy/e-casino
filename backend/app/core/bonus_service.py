from uuid import UUID


class BonusService:
    @staticmethod
    async def grant_bonus_by_id(
        cursor,           # Active DB cursor
        player_id: UUID,
        campaign_id: UUID,
        amount_override: float = None 
    ):
        """
        Grants bonus using a specific Campaign ID.
        """
        # 1. Fetching Campaign Details
        await cursor.execute(
            "SELECT tenant_id, bonus_type FROM BonusCampaign WHERE campaign_id = %s",
            (campaign_id,)
        )
        campaign = await cursor.fetchone()
        
        if not campaign:
            print(f"Campaign {campaign_id} not found.")
            return

        amount = amount_override if amount_override else 50.0

        # 3. Get Tenant Currency
        await cursor.execute("SELECT default_currency_code FROM Tenant WHERE tenant_id = %s", (campaign['tenant_id'],))
        currency = (await cursor.fetchone())['default_currency_code']

        # 4. Create PlayerBonus
        await cursor.execute(
            """
            INSERT INTO PlayerBonus 
            (player_id, campaign_id, status, wagered_amount, initial_amount, awarded_at)
            VALUES (%s, %s, 'ACTIVE', 0, %s, NOW())
            """,
            (player_id, campaign_id, amount)
        )

        # 5. Credit BONUS Wallet
        await cursor.execute(
            "SELECT wallet_id, balance FROM Wallet WHERE player_id = %s AND wallet_type = 'BONUS'",
            (player_id,)
        )
        bonus_wallet = await cursor.fetchone()

        if bonus_wallet:
            new_bal = float(bonus_wallet['balance']) + amount
            await cursor.execute("UPDATE Wallet SET balance = %s WHERE wallet_id = %s", (new_bal, bonus_wallet['wallet_id']))
        else:
            await cursor.execute(
                """
                INSERT INTO Wallet (player_id, wallet_type, currency_code, balance)
                VALUES (%s, 'BONUS', %s, %s)
                """,
                (player_id, currency, amount)
            )
            
        print(f"Granted ${amount} (Campaign: {campaign_id}) to Player {player_id}")