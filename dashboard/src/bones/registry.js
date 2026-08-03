import { registerBones } from 'boneyard-js/react'

/**
 * Boneyard Skeletons Registry
 * Automatically loaded by Boneyard at runtime.
 */
export const bonesRegistry = {}

// Register any pre-compiled bone layouts
registerBones(bonesRegistry)

export default bonesRegistry
