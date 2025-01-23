import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import supabase from "@/utils/supabase";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export default function AddRecipe() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  const navigate = useNavigate();

  async function saveRecipe() {
    if (title === "" || description === "") {
      alert("Please fill in all fields.");
      return;
    }

    const { error } = await supabase
      .from("recipes")
      .insert([{ name: title, description, link }])
      .select();

    if (!error) {
      navigate("/discover");
    } else {
      console.error(error);
      alert("An error occurred. Please try again.");
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-10">Add Recipe</h1>

      <div className="grid w-full items-center gap-5">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            type="text"
            id="title"
            placeholder="Tomato soup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid w-full gap-2">
          <Label htmlFor="message">Description</Label>
          <Textarea
            placeholder="A beatiful and healthy dish."
            id="message"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid w-full items-center gap-2">
          <Label htmlFor="link">Link</Label>
          <Input
            type="text"
            id="link"
            placeholder="https://www.tomato-soup.com"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 w-full mt-11">
        <Button asChild className="w-full" variant="secondary">
          <Link to="/discover">Cancel</Link>
        </Button>
        <Button className="w-full" onClick={saveRecipe}>
          Save
        </Button>
      </div>
    </Layout>
  );
}
