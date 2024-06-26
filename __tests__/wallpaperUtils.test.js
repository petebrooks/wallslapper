import fs from "fs"
import { setWallpaper } from "wallpaper"
import { createSolidColorImage } from "../imageUtils.js"
import {
	resolveScheduledColor,
	transitionToColor,
	writeCurrentColor,
} from "../wallpaperUtils.js"

jest.mock("fs", () => ({
	promises: {
		writeFile: jest.fn(),
	},
}))

jest.mock("wallpaper", () => ({
	setWallpaper: jest.fn(),
}))

jest.mock("../imageUtils.js", () => ({
	createSolidColorImage: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks();
});

describe("writeCurrentColor", () => {
	it("should write the color to currentColor.txt", async () => {
		const color = "#FF5733"
		await writeCurrentColor(color)
		expect(fs.promises.writeFile).toHaveBeenCalledWith(
			"currentColor.txt",
			color,
			"utf8"
		)
	})

	it("should handle errors gracefully", async () => {
		const error = new Error("Failed to write file")
		fs.promises.writeFile.mockRejectedValueOnce(error)
		console.error = jest.fn()

		const color = "#FF5733"
		await writeCurrentColor(color)
		expect(console.error).toHaveBeenCalledWith("Error writing current color:", error)
	})
})

describe("transitionToColor", () => {
	it("should transition colors correctly", async () => {
		const startColor = "#000000"
		const endColor = "#FFFFFF"
		const transitionTime = 1000
		const minInterval = 100;
		const expectedSteps = Math.max(1, Math.floor(transitionTime / minInterval));
		await transitionToColor(startColor, endColor, transitionTime)
		expect(createSolidColorImage).toHaveBeenCalledTimes(expectedSteps)
		expect(setWallpaper).toHaveBeenCalledTimes(expectedSteps)
	})

	it("should handle instant transition", async () => {
		const startColor = "#000000"
		const endColor = "#FFFFFF"
		const transitionTime = 0
		await transitionToColor(startColor, endColor, transitionTime)
		expect(createSolidColorImage).toHaveBeenCalledTimes(1)
		expect(setWallpaper).toHaveBeenCalledTimes(1)
	})
})

describe("resolveScheduledColor", () => {
	it("should select the correct scheduled color", () => {
		const schedule = {
			"08:00": "#FF0000",
			"12:00": "#00FF00",
			"18:00": "#0000FF",
		}

		// Mock the current time to 10:00
		const mockDate = new Date("2023-06-01T10:00:00")
		jest.spyOn(global, "Date").mockImplementation(() => mockDate)

		const selectedColor = resolveScheduledColor(schedule)
		expect(selectedColor).toBe("#FF0000")

		// Restore the original Date implementation
		jest.restoreAllMocks()
	})

	it("should return null if no scheduled color matches", () => {
		const schedule = {
			"08:00": "#FF0000",
			"12:00": "#00FF00",
			"18:00": "#0000FF",
		}

		// Mock the current time to 06:00
		const mockDate = new Date("2023-06-01T06:00:00")
		jest.spyOn(global, "Date").mockImplementation(() => mockDate)

		const selectedColor = resolveScheduledColor(schedule)
		expect(selectedColor).toBeNull()

		// Restore the original Date implementation
		jest.restoreAllMocks()
	})
})
