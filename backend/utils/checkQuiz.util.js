import User from "../models/Users.model.js";
import Result from "../models/Result.model.js";

async function checkQuiz(userId, response) {
    try {

        const user = await User.findById(userId).populate("questionsProvided", "correct");

        const questionsProvided = user.questionsProvided;

        console.log(questionsProvided, response);

        let totalPoints = 0;

        for (const ques of questionsProvided) {

            const userResponse = response.find(obj => obj.quesId === ques._id.toString());

            console.log(userResponse, ques);

            if (userResponse && userResponse.selected === ques.correct) {
                totalPoints += 2;
            }

        }

        await Result.findOneAndUpdate(
            { userId },
            { $set: { points: totalPoints } },
            { upsert: true, new: true }
        );

        return true;


    } catch (err) {
        console.log("Quiz Checking Failed.", err.message);
        return false;
    }
}

export default checkQuiz;