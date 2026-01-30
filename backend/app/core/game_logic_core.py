import random

class GameLogic:
    @staticmethod
    def play_slot_machine():
        symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣']
        # Weights: 7 is rare, Cherry is common
        weights = [30, 25, 20, 15, 7, 2, 1] 
        result = random.choices(symbols, weights=weights, k=3)
        
        multiplier = 0.0
        if result[0] == result[1] == result[2]:
            if result[0] == '7️⃣': multiplier = 50.0 #all 7's
            elif result[0] == '💎': multiplier = 20.0 #all diamonds
            elif result[0] == '🔔': multiplier = 15.0
            else: multiplier = 10.0
        elif result[0] == result[1] or result[1] == result[2]:
            multiplier = 1.5 # If 2 symbols matches
            
        return multiplier, {"symbols": result} 

    @staticmethod
    def play_dice_roll(prediction):
        result = random.randint(1, 6)
        # Check Win
        is_win = str(prediction) == str(result)
        multiplier = 5.0 if is_win else 0.0 
        return multiplier, {"roll": result} 

    @staticmethod
    def play_coin_flip(prediction):
        result = random.choice(["HEADS", "TAILS"])    
        is_win = prediction.upper() == result
        multiplier = 1.9 if is_win else 0.0 
        return multiplier, {"flip": result} 

    @staticmethod
    def play_wheel_of_fortune(prediction):
        result = random.randint(1, 20)
        is_win = str(prediction) == str(result)
        multiplier = 15.0 if is_win else 0.0 
        return multiplier, {"segment": result}

    @staticmethod
    def play_high_low(prediction):
        # 1-6 = LOW, 8-13 = HIGH, 7 = ON House(Lose)
        card = random.randint(1, 13)
        is_win = False
        if prediction.upper() == "LOW" and card < 7: is_win = True
        elif prediction.upper() == "HIGH" and card > 7: is_win = True
        multiplier = 1.9 if is_win else 0.0
        return multiplier, {"card": card}