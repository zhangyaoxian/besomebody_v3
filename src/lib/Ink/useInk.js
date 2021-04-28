import React from 'react'
import { Story } from 'inkjs'
import { initInk, STORY_VALUE_TYPE } from './initInk'

const useInk = (json) => {
  // Initialise inkjs
  const inkStory = React.useMemo(() => initInk(Story, json), [json])

  // Story initialising state is a boolean
  const [isStoryStarted, setIsStoryStarted] = React.useState(false)

  // Paragraphs is an array of object that contains
  // { text: string, tags: string[] }
  const [paragraphs, setParagraphs] = React.useState([])

  // Choices is an array of object that contains
  // { text: string, index: number, tags: string[] }
  const [choices, setChoices] = React.useState([])

  // SpecialTags is an dynamic object with only strings as it values
  const [specialTags, setSpecialTags] = React.useState({})

  // Save story progression states
  const [savedTexts, setSavedTexts] = React.useState(null)
  const [paragraphsSnapShot, setParagraphsSnapShot] = React.useState([])
  const [choicesSnapShot, setChoicesSnapShot] = React.useState([])
  const [specialTagsSnapShot, setSpecialTagsSnapShot] = React.useState({})

  /**
   * To update special tags with:
   * - The content before the first colon in the tag as the key
   * - The content after the first colon in the tag as as the value
   * @param {* string[]} tags
   */
  const handleUpdateSpecialTags = (tags) => {
    const nextSpecialTags = { ...specialTags }
    tags.map((tag) => {
      const key = tag.substr(0, tag.indexOf(':'))
      const value = tag.substr(tag.indexOf(':') + 1)
      nextSpecialTags[key] = value
      return null
    })

    setSpecialTags(nextSpecialTags)
  }

  /**
   * To fetch next sequence in story
   * - Set storyStarted to true if it is false
   * - Update specialTags if there are special tags
   * - Update either choices or paragraphs state
   */
  const handleGetStory = () => {
    // Set storyStarted to true if it is false
    if (!isStoryStarted) setIsStoryStarted(true)

    const nextStep = inkStory.nextStoryStep()
    if (!nextStep) return null

    // Update specialTags if there are special tags
    const currentSpecialTags = nextStep.tags.filter((tag) => tag.includes(':'))
    if (currentSpecialTags.length) handleUpdateSpecialTags(currentSpecialTags)
    const nonSpecialTags = nextStep.tags.filter((tag) => !tag.includes(':'))

    switch (nextStep.type) {
      // Append to existing paragraphs array
      case STORY_VALUE_TYPE.TEXT: {
        const values = {
          text: nextStep.values,
          tags: nonSpecialTags,
        }
        return setParagraphs([...paragraphs, values])
      }

      // Replaces existing choices array
      case STORY_VALUE_TYPE.CHOICE: {
        const nextChoices = nextStep.values.map((step) => {
          return {
            text: step.text,
            index: step.index,
            tags: nonSpecialTags,
          }
        })
        return setChoices(nextChoices)
      }
      default:
        return
    }
  }

  /**
   * Submit choice to story and fetch next sequence
   * @param {* number} choiceIndex
   */
  const handleSetChoice = (choiceIndex) => {
    setChoices([])
    inkStory.selectChoice(choiceIndex)
    handleGetStory()
  }

  // Reset both React and inkStory states
  const handleResetStory = () => {
    setIsStoryStarted(false)
    setParagraphs([])
    setChoices([])
    setSpecialTags({})
    inkStory.resetStory()
  }

  /**
   * Set starting point in inkjs and fetch next sequence
   * @param {* string} pathName
   */
  const handleStartStoryFrom = (pathName) => {
    inkStory.startStoryFrom(pathName)
    setIsStoryStarted(true)
    handleGetStory()
  }

  // Save snapshots of both React and inkStory states
  const handleSaveStory = () => {
    setParagraphsSnapShot(paragraphs)
    setChoicesSnapShot(choices)
    setSpecialTagsSnapShot(specialTags)
    const savedState = inkStory.saveStoryState()
    setSavedTexts(savedState)
  }

  /**
   * Load the paragraphs or choices in local snapshots back into the React states
   * Submit the ink saved state back to inkjs so it knows where to start fetching the next story from
   * @param {* json string} savedState
   */
  const handleLoadSavedStory = (savedState) => {
    if (!(savedState && paragraphsSnapShot.length)) return null

    setParagraphs(paragraphsSnapShot)
    setChoices(choicesSnapShot)
    setSpecialTags(specialTagsSnapShot)
    setIsStoryStarted(true)
    inkStory.loadStoryState(savedState)
  }

  // Clear snapshots in React states
  const handleResetSavedStory = () => {
    setParagraphsSnapShot([])
    setChoicesSnapShot([])
    setSavedTexts(null)
  }

  return {
    // States
    isStoryStarted,
    paragraphs,
    choices,
    specialTags,
    savedTexts,

    // Methods
    getStory: handleGetStory,
    setChoice: handleSetChoice,
    resetStory: handleResetStory,
    startStoryFrom: handleStartStoryFrom,
    saveStory: handleSaveStory,
    loadSavedStory: handleLoadSavedStory,
    resetSavedStory: handleResetSavedStory,
  }
}

export default useInk
