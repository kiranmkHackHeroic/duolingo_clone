import asyncio
import datetime
from sqlalchemy import select, delete
from app.database import AsyncSessionLocal, engine
from app.models import (
    Base, Course, Unit, Skill, Lesson, Exercise,
    User, UserProgress, UserSkillProgress, Achievement, UserAchievement, LeaderboardEntry
)
from app.services.auth import hash_password
async def seed_data():
    async with AsyncSessionLocal() as session:
        # Clear existing data to make the seed idempotent
        print("Cleaning up database tables...")
        await session.execute(delete(UserAchievement))
        await session.execute(delete(LeaderboardEntry))
        await session.execute(delete(UserSkillProgress))
        await session.execute(delete(UserProgress))
        await session.execute(delete(User))
        await session.execute(delete(Achievement))
        await session.execute(delete(Exercise))
        await session.execute(delete(Lesson))
        await session.execute(delete(Skill))
        await session.execute(delete(Unit))
        await session.execute(delete(Course))
        await session.commit()

        print("Seeding Course, Units, and Skills...")
        # 1. Course
        spanish_course = Course(
            id=1,
            name="Spanish",
            language_code="es",
            flag_emoji="🇪🇸"
        )
        session.add(spanish_course)

        # 2. Units
        unit1 = Unit(
            id=1,
            course_id=1,
            title="Unit 1: Basics",
            description="Greet people, order food, and talk about yourself",
            order_index=1,
            color_theme="#58CC02"
        )
        unit2 = Unit(
            id=2,
            course_id=1,
            title="Unit 2: Daily Life",
            description="Talk about hobbies, school, and work",
            order_index=2,
            color_theme="#1CB0F6"
        )
        unit3 = Unit(
            id=3,
            course_id=1,
            title="Unit 3: Travel",
            description="Get around town, book hotels, and explore",
            order_index=3,
            color_theme="#FF9600"
        )
        session.add_all([unit1, unit2, unit3])

        # 3. Skills
        # Unit 1 Skills
        greetings_skill = Skill(
            id=1,
            unit_id=1,
            title="Greetings",
            icon="👋",
            order_index=1,
            required_skill_id=None,
            total_lessons=3
        )
        intro_skill = Skill(
            id=2,
            unit_id=1,
            title="Intro",
            icon="👤",
            order_index=2,
            required_skill_id=1, # requires Greetings
            total_lessons=3
        )
        food_skill = Skill(
            id=3,
            unit_id=1,
            title="Food",
            icon="🍎",
            order_index=3,
            required_skill_id=2, # requires Intro
            total_lessons=3
        )
        # Unit 2 Skills
        hobbies_skill = Skill(
            id=4,
            unit_id=2,
            title="Hobbies",
            icon="⚽",
            order_index=1,
            required_skill_id=3, # requires Food
            total_lessons=3
        )
        people_skill = Skill(
            id=5,
            unit_id=2,
            title="People",
            icon="👨‍👩‍👧",
            order_index=2,
            required_skill_id=4,
            total_lessons=3
        )
        # Unit 3 Skills
        travel_skill = Skill(
            id=6,
            unit_id=3,
            title="Travel",
            icon="✈️",
            order_index=1,
            required_skill_id=5,
            total_lessons=3
        )
        session.add_all([greetings_skill, intro_skill, food_skill, hobbies_skill, people_skill, travel_skill])
        await session.flush() # Ensure foreign keys are validated and IDs populated

        # Seeding French Course (id=2)
        french_course = Course(id=2, name="French", language_code="fr", flag_emoji="🇫🇷")
        session.add(french_course)
        
        french_unit = Unit(
            id=4,
            course_id=2,
            title="Unit 1: Basics",
            description="Learn basic greetings in French",
            order_index=1,
            color_theme="#58CC02"
        )
        session.add(french_unit)
        
        french_skill = Skill(
            id=7,
            unit_id=4,
            title="Greetings",
            icon="👋",
            order_index=1,
            required_skill_id=None,
            total_lessons=1
        )
        session.add(french_skill)
        await session.flush()
        
        french_lesson = Lesson(id=10, skill_id=7, order_index=1, lesson_type="new_skill")
        session.add(french_lesson)
        await session.flush()
        
        fr_ex1 = Exercise(
            id=21,
            lesson_id=10,
            order_index=1,
            exercise_type="multiple_choice",
            prompt="Select the correct translation for: 'Hello'",
            data={"options": ["Bonjour", "Au revoir", "Merci"]},
            correct_answer={"index": 0}
        )
        fr_ex2 = Exercise(
            id=22,
            lesson_id=10,
            order_index=2,
            exercise_type="translate",
            prompt="Translate this sentence:",
            data={"source_text": "Bonjour"},
            correct_answer={"accepted": ["hello", "good morning"]}
        )
        session.add_all([fr_ex1, fr_ex2])

        # Seeding German Course (id=3)
        german_course = Course(id=3, name="German", language_code="de", flag_emoji="🇩🇪")
        session.add(german_course)
        
        german_unit = Unit(
            id=5,
            course_id=3,
            title="Unit 1: Basics",
            description="Learn basic greetings in German",
            order_index=1,
            color_theme="#58CC02"
        )
        session.add(german_unit)
        
        german_skill = Skill(
            id=8,
            unit_id=5,
            title="Greetings",
            icon="👋",
            order_index=1,
            required_skill_id=None,
            total_lessons=1
        )
        session.add(german_skill)
        await session.flush()
        
        german_lesson = Lesson(id=11, skill_id=8, order_index=1, lesson_type="new_skill")
        session.add(german_lesson)
        await session.flush()
        
        de_ex1 = Exercise(
            id=23,
            lesson_id=11,
            order_index=1,
            exercise_type="multiple_choice",
            prompt="Select the correct translation for: 'Hello'",
            data={"options": ["Hallo", "Auf Wiedersehen", "Danke"]},
            correct_answer={"index": 0}
        )
        de_ex2 = Exercise(
            id=24,
            lesson_id=11,
            order_index=2,
            exercise_type="translate",
            prompt="Translate this sentence:",
            data={"source_text": "Hallo"},
            correct_answer={"accepted": ["hello", "hi"]}
        )
        session.add_all([de_ex1, de_ex2])
        await session.flush()

        # 4. Lessons & Exercises for Greetings (Skill 1)
        print("Seeding Lessons and Exercises...")
        
        # Skill 1, Lesson 1
        l1_s1 = Lesson(id=1, skill_id=1, order_index=1, lesson_type="new_skill")
        # Skill 1, Lesson 2
        l2_s1 = Lesson(id=2, skill_id=1, order_index=2, lesson_type="new_skill")
        # Skill 1, Lesson 3 (Practice)
        l3_s1 = Lesson(id=3, skill_id=1, order_index=3, lesson_type="practice")

        # Skill 2, Lesson 1
        l1_s2 = Lesson(id=4, skill_id=2, order_index=1, lesson_type="new_skill")
        # Skill 2, Lesson 2
        l2_s2 = Lesson(id=5, skill_id=2, order_index=2, lesson_type="new_skill")
        # Skill 2, Lesson 3
        l3_s2 = Lesson(id=6, skill_id=2, order_index=3, lesson_type="practice")

        # Skill 3, Lesson 1
        l1_s3 = Lesson(id=7, skill_id=3, order_index=1, lesson_type="new_skill")

        session.add_all([l1_s1, l2_s1, l3_s1, l1_s2, l2_s2, l3_s2, l1_s3])
        await session.flush()

        # Exercises for Greetings, Lesson 1
        exercises = [
            # 1. Multiple Choice
            Exercise(
                id=1,
                lesson_id=1,
                order_index=1,
                exercise_type="multiple_choice",
                prompt="Select the correct translation for: 'Hello'",
                data={"options": ["hola", "adiós", "gracias", "por favor"], "media": None},
                correct_answer={"index": 0}
            ),
            # 2. Fill in the blank
            Exercise(
                id=2,
                lesson_id=1,
                order_index=2,
                exercise_type="fill_blank",
                prompt="Select the word that matches the context",
                data={
                    "sentence_parts": ["¡Hola! ¿Cómo ", "___", " tú?"],
                    "options": ["estás", "es", "soy"]
                },
                correct_answer={"answer": "estás"}
            ),
            # 3. Translate / Type Answer
            Exercise(
                id=3,
                lesson_id=1,
                order_index=3,
                exercise_type="translate",
                prompt="Translate this sentence: 'Good morning'",
                data={"source_text": "Good morning", "source_lang": "en"},
                correct_answer={"accepted": ["buenos días", "buen día"]}
            ),
            # 4. Word Bank
            Exercise(
                id=4,
                lesson_id=1,
                order_index=4,
                exercise_type="word_bank",
                prompt="Translate this sentence using the word bank",
                data={
                    "word_bank": ["gracias", "hola", "adiós", "tú", "yo"],
                    "prompt_translation": "Thank you"
                },
                correct_answer={"sequence": ["gracias"]}
            ),
            # 5. Match Pairs
            Exercise(
                id=5,
                lesson_id=1,
                order_index=5,
                exercise_type="match_pairs",
                prompt="Match the Spanish words with their English meanings",
                data={
                    "pairs": [
                        ["hola", "hello"],
                        ["adiós", "goodbye"],
                        ["gracias", "thank you"],
                        ["por favor", "please"]
                    ]
                },
                correct_answer={} # derived from pairs
            )
        ]

        # Exercises for Greetings, Lesson 2
        exercises_l2 = [
            Exercise(
                id=6,
                lesson_id=2,
                order_index=1,
                exercise_type="multiple_choice",
                prompt="Select the correct translation for: 'Goodbye'",
                data={"options": ["hola", "adiós", "gracias", "de nada"], "media": None},
                correct_answer={"index": 1}
            ),
            Exercise(
                id=7,
                lesson_id=2,
                order_index=2,
                exercise_type="translate",
                prompt="Translate this sentence: 'Please'",
                data={"source_text": "Please", "source_lang": "en"},
                correct_answer={"accepted": ["por favor"]}
            ),
            Exercise(
                id=8,
                lesson_id=2,
                order_index=3,
                exercise_type="fill_blank",
                prompt="Select the word that matches the context",
                data={
                    "sentence_parts": ["Muchas ", "___", " por la ayuda."],
                    "options": ["gracias", "de nada", "hola"]
                },
                correct_answer={"answer": "gracias"}
            ),
            Exercise(
                id=9,
                lesson_id=2,
                order_index=4,
                exercise_type="word_bank",
                prompt="Translate this sentence using the word bank",
                data={
                    "word_bank": ["gracias", "hola", "adiós", "de", "nada"],
                    "prompt_translation": "You are welcome"
                },
                correct_answer={"sequence": ["de", "nada"]}
            ),
            Exercise(
                id=10,
                lesson_id=2,
                order_index=5,
                exercise_type="match_pairs",
                prompt="Match the Spanish words with their English meanings",
                data={
                    "pairs": [
                        ["sí", "yes"],
                        ["no", "no"],
                        ["buenos días", "good morning"],
                        ["de nada", "you're welcome"]
                    ]
                },
                correct_answer={}
            )
        ]

        # Exercises for Intro, Lesson 1 (Skill 2, Lesson 1)
        exercises_s2_l1 = [
            Exercise(
                id=11,
                lesson_id=4,
                order_index=1,
                exercise_type="multiple_choice",
                prompt="Select the correct translation for: 'the boy'",
                data={"options": ["el niño", "la niña", "el hombre", "la mujer"], "media": None},
                correct_answer={"index": 0}
            ),
            Exercise(
                id=12,
                lesson_id=4,
                order_index=2,
                exercise_type="translate",
                prompt="Translate: 'I am a man'",
                data={"source_text": "I am a man", "source_lang": "en"},
                correct_answer={"accepted": ["yo soy un hombre", "soy un hombre"]}
            ),
            Exercise(
                id=13,
                lesson_id=4,
                order_index=3,
                exercise_type="fill_blank",
                prompt="Select the correct pronoun",
                data={
                    "sentence_parts": ["", "___", " soy una mujer."],
                    "options": ["Yo", "Él", "Nosotros"]
                },
                correct_answer={"answer": "Yo"}
            ),
            Exercise(
                id=14,
                lesson_id=4,
                order_index=4,
                exercise_type="word_bank",
                prompt="Translate using word bank",
                data={
                    "word_bank": ["una", "niña", "yo", "soy", "un", "niño"],
                    "prompt_translation": "a girl"
                },
                correct_answer={"sequence": ["una", "niña"]}
            ),
            Exercise(
                id=15,
                lesson_id=4,
                order_index=5,
                exercise_type="match_pairs",
                prompt="Match pairs",
                data={
                    "pairs": [
                        ["hombre", "man"],
                        ["mujer", "woman"],
                        ["niño", "boy"],
                        ["niña", "girl"]
                    ]
                },
                correct_answer={}
            )
        ]

        # Let's seed simple exercises for other lessons as well
        # We can reuse similar greetings/intro exercises for the remaining lessons to save space
        exercises_other = [
            Exercise(
                id=16,
                lesson_id=3, # Greetings Practice
                order_index=1,
                exercise_type="multiple_choice",
                prompt="Select the correct translation for: 'Hello, please'",
                data={"options": ["hola por favor", "adiós gracias", "gracias de nada"], "media": None},
                correct_answer={"index": 0}
            ),
            Exercise(
                id=17,
                lesson_id=5, # Intro L2
                order_index=1,
                exercise_type="multiple_choice",
                prompt="Select the correct translation for: 'the woman'",
                data={"options": ["el hombre", "la mujer", "la niña", "el niño"], "media": None},
                correct_answer={"index": 1}
            ),
            Exercise(
                id=18,
                lesson_id=6, # Intro L3 Practice
                order_index=1,
                exercise_type="translate",
                prompt="Translate: 'the boy'",
                data={"source_text": "the boy", "source_lang": "en"},
                correct_answer={"accepted": ["el niño"]}
            ),
            Exercise(
                id=19,
                lesson_id=7, # Food L1
                order_index=1,
                exercise_type="multiple_choice",
                prompt="Select the correct translation for: 'the apple'",
                data={"options": ["la manzana", "el pan", "el agua", "la leche"], "media": None},
                correct_answer={"index": 0}
            ),
            Exercise(
                id=20,
                lesson_id=7, # Food L1 Exercise 2
                order_index=2,
                exercise_type="translate",
                prompt="Translate: 'I eat bread'",
                data={"source_text": "I eat bread", "source_lang": "en"},
                correct_answer={"accepted": ["yo como pan", "como pan"]}
            )
        ]

        session.add_all(exercises)
        session.add_all(exercises_l2)
        session.add_all(exercises_s2_l1)
        session.add_all(exercises_other)
        await session.flush()

        # 5. Achievements
        print("Seeding Achievements...")
        ach1 = Achievement(
            id=1,
            code="streak_7",
            title="Wildfire",
            description="Reach a 7-day streak",
            icon="🔥",
            streak_threshold=7
        )
        ach2 = Achievement(
            id=2,
            code="xp_100",
            title="Sage",
            description="Earn 100 total XP",
            icon="🦉",
            xp_threshold=100
        )
        ach3 = Achievement(
            id=3,
            code="perfect_lesson",
            title="Superstar",
            description="Complete a lesson with no mistakes",
            icon="⭐",
            xp_threshold=None
        )
        session.add_all([ach1, ach2, ach3])
        await session.flush()

        # 6. Users (Real User + Competitors)
        print("Seeding Users and UserProgress...")
        real_user = User(
            id=1,
            username="duo_learner",
            display_name="Duo Learner",
            hashed_password=hash_password("password123"),
            avatar_url="https://api.dicebear.com/7.x/adventurer/svg?seed=duo_learner"
        )
        session.add(real_user)

        # Setup progress for main user (partial progress)
        # Yesterday was activity date so streak is 5 and can be incremented to 6 today
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        progress_real = UserProgress(
            user_id=1,
            active_course_id=1,
            total_xp=250,
            current_streak=5,
            longest_streak=10,
            hearts=4,
            max_hearts=5,
            gems=350,
            daily_xp_goal=50,
            xp_today=20,
            last_activity_date=yesterday,
            streak_freeze_count=1
        )
        session.add(progress_real)

        # Main user's skill progress
        # Greetings completed (all 3 lessons done)
        sp_greetings = UserSkillProgress(
            user_id=1,
            skill_id=1,
            status="completed",
            crowns=1,
            lessons_completed=3,
            last_practiced_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        )
        # Intro in progress (1 lesson done out of 3)
        sp_intro = UserSkillProgress(
            user_id=1,
            skill_id=2,
            status="in_progress",
            crowns=0,
            lessons_completed=1,
            last_practiced_at=datetime.datetime.utcnow() - datetime.timedelta(hours=12)
        )
        # Food available but not started (0 lessons done)
        sp_food = UserSkillProgress(
            user_id=1,
            skill_id=3,
            status="available",
            crowns=0,
            lessons_completed=0
        )
        # Other skills are locked (default)
        sp_hobbies = UserSkillProgress(user_id=1, skill_id=4, status="locked")
        sp_people = UserSkillProgress(user_id=1, skill_id=5, status="locked")
        sp_travel = UserSkillProgress(user_id=1, skill_id=6, status="locked")
        session.add_all([sp_greetings, sp_intro, sp_food, sp_hobbies, sp_people, sp_travel])

        # Main user achievements earned
        user_ach = UserAchievement(
            user_id=1,
            achievement_id=2, # Sage (100 XP)
            earned_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
        )
        session.add(user_ach)

        # Seed Leaderboard and fake competitors
        competitors_data = [
            ("speedy", "Speedy Gonzales", 450, "https://api.dicebear.com/7.x/adventurer/svg?seed=speedy"),
            ("polyglot", "Polyglot Owl", 380, "https://api.dicebear.com/7.x/adventurer/svg?seed=polyglot"),
            ("linguist", "Linguist Pro", 180, "https://api.dicebear.com/7.x/adventurer/svg?seed=linguist"),
            ("casual_owl", "Casual Owl", 90, "https://api.dicebear.com/7.x/adventurer/svg?seed=casual_owl"),
            ("rookie", "Duo Rookie", 30, "https://api.dicebear.com/7.x/adventurer/svg?seed=rookie"),
        ]

        # Real user entry
        real_user_entry = LeaderboardEntry(
            user_id=1,
            league="bronze",
            xp_this_week=120
        )
        session.add(real_user_entry)

        # Competitor entries
        comp_id = 2
        for username, display_name, xp_week, avatar in competitors_data:
            comp_user = User(
                id=comp_id,
                username=username,
                display_name=display_name,
                hashed_password=hash_password("password123"),
                avatar_url=avatar
            )
            session.add(comp_user)
            await session.flush() # Populate ID

            comp_progress = UserProgress(
                user_id=comp_id,
                active_course_id=1,
                total_xp=xp_week + 100,
                current_streak=3,
                longest_streak=5,
                hearts=5,
                gems=200
            )
            session.add(comp_progress)

            comp_entry = LeaderboardEntry(
                user_id=comp_id,
                league="bronze",
                xp_this_week=xp_week
            )
            session.add(comp_entry)
            comp_id += 1

        await session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
