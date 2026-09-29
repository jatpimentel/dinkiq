import { useEffect, useState } from "react";
import api from "../services/api";

function Skills() {
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        api.get("/skills/")
            .then((response) => {
                setSkills(response.data);
            })
            .catch((error) => {
                console.error("Error fetching skills:", error);
        });
    }, []);

    return (
        <div>
            <h1>DinkIQ</h1>
            <h2>Pickleball Skills</h2>

            {skills.map((skill) => (
                <div key={skill.id}>
                    {skill.name}
                </div>
            ))}
        </div>
    );
}

export default Skills;